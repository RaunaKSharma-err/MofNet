import httpx
import json
import time
import sys

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8001"

QUESTIONS = [
    {"question": "What is reproduction in plants?", "grade": 7, "subject": "science"},
    {"question": "What is cell structure?", "grade": 7, "subject": "science"},
    {"question": "What are natural numbers?", "grade": 6, "subject": "mathematics"},
]


def ask_stream(question, grade, subject, **overrides):
    payload = {
        "question": question,
        "grade": grade,
        "subject": subject,
        "language": "en",
    }
    params = {"stream": True}
    for key, value in overrides.items():
        if value is not None:
            params[key] = value

    start = time.perf_counter()
    full_answer = ""
    tokens = 0
    ttft = None
    error = None
    top_score = 0.0

    try:
        with httpx.Client(timeout=120) as client:
            with client.stream("POST", f"{BASE_URL}/ask", json=payload, params=params) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data:"):
                        data_str = line[5:].strip()
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                        if "error" in data:
                            error = data["error"]
                            break
                        if data.get("done"):
                            full_answer = data.get("answer", full_answer)
                            top_score = data.get("top_score", 0.0)
                            break
                        if "chunk" in data and data["chunk"]:
                            if ttft is None:
                                ttft = (time.perf_counter() - start) * 1000
                            tokens += 1
                            full_answer += data["chunk"]
    except Exception as e:
        error = str(e)

    total_ms = (time.perf_counter() - start) * 1000
    return {
        "answer": full_answer,
        "tokens": tokens,
        "ttft_ms": ttft,
        "total_ms": total_ms,
        "error": error,
        "top_score": top_score,
    }


def run_test(label, questions, **overrides):
    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"{'='*60}")
    results = []
    for q in questions:
        result = ask_stream(q["question"], q["grade"], q["subject"], **overrides)
        results.append(result)
        ttft_str = "{:.0f}".format(result["ttft_ms"]) if result["ttft_ms"] is not None else "N/A"
        tokens_str = str(result.get("tokens", "N/A"))
        status = "GATE REJECTED" if result.get("tokens", 0) == 0 and not result.get("error") else ""
        print(f"Q: {q['question'][:50]}")
        print(f"  TTFT: {ttft_str} ms | Total: {result['total_ms']:.0f} ms | Tokens: {tokens_str} | Score: {result.get('top_score', 0):.3f} {status}")
        if result.get("error"):
            print(f"  ERROR: {result['error']}")
    return results


if __name__ == "__main__":
    print("MofNet Controlled Benchmark")
    print("Model: llama3.2:1b")

    # Warm-up
    print("\nWarming up...")
    ask_stream("Hello", 7, "science")
    time.sleep(2)

    # Baseline
    run_test("Baseline (top_k=3, np=96, nt=auto)", QUESTIONS)

    # Top-k comparison
    for tk in [1, 2, 3]:
        run_test(f"top_k={tk}, np=96, nt=auto", QUESTIONS, top_k_override=tk)

    # num_predict comparison
    for np_val in [80, 96]:
        run_test(f"top_k=2, np={np_val}, nt=auto", QUESTIONS, top_k_override=2, num_predict_override=np_val)

    # num_thread comparison
    for nt in [2, "auto"]:
        run_test(f"top_k=2, np=96, nt={nt}", QUESTIONS, top_k_override=2, num_thread_override=nt if nt != "auto" else None)

    print("\nBenchmark complete.")
