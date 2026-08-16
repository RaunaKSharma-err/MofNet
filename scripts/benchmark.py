import httpx
import json
import time
import sys
import os

BASE_URL = "http://localhost:8001"

QUESTIONS = [
    {"question": "What is photosynthesis?", "grade": 7, "subject": "science"},
    {"question": "Explain the process of respiration in humans.", "grade": 7, "subject": "science"},
    {"question": "What is the function of the nucleus in a cell?", "grade": 7, "subject": "science"},
    {"question": "Describe the water cycle.", "grade": 7, "subject": "science"},
    {"question": "What are the different states of matter?", "grade": 7, "subject": "science"},
    {"question": "Explain the concept of force and motion.", "grade": 7, "subject": "science"},
    {"question": "What is the solar system?", "grade": 7, "subject": "science"},
    {"question": "Describe the human digestive system.", "grade": 7, "subject": "science"},
    {"question": "What is photosynthesis and why is it important?", "grade": 7, "subject": "science"},
    {"question": "What is the capital of France?", "grade": 7, "subject": "geography"},
    {"question": "Explain quantum entanglement.", "grade": 7, "subject": "science"},
]


def ask_stream(question, grade, subject, top_k=None, confidence_threshold=None):
    payload = {
        "question": question,
        "grade": grade,
        "subject": subject,
        "language": "en",
    }
    params = {"stream": True}
    if top_k is not None:
        params["top_k_override"] = top_k
    if confidence_threshold is not None:
        params["confidence_threshold"] = confidence_threshold

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


def ask_nonstream(question, grade, subject):
    payload = {
        "question": question,
        "grade": grade,
        "subject": subject,
        "language": "en",
    }
    start = time.perf_counter()
    with httpx.Client(timeout=120) as client:
        response = client.post(f"{BASE_URL}/ask", json=payload, params={"stream": False})
        response.raise_for_status()
        data = response.json()
    total_ms = (time.perf_counter() - start) * 1000
    return {
        "answer": data.get("answer", ""),
        "total_ms": total_ms,
        "cached": data.get("cached", False),
        "gate_rejected": data.get("gate_rejected", False),
        "top_score": data.get("top_score", 0),
    }


def run_benchmark(label, questions, top_k=None, confidence_threshold=None, stream=True):
    print(f"\n{'='*60}")
    print(f"BENCHMARK: {label}")
    print(f"{'='*60}")
    results = []
    for q in questions:
        if stream:
            result = ask_stream(q["question"], q["grade"], q["subject"], top_k, confidence_threshold)
        else:
            result = ask_nonstream(q["question"], q["grade"], q["subject"])
        results.append(result)
        ttft_str = f"{result.get('ttft_ms', 0):.0f}" if result.get('ttft_ms') is not None else "N/A"
        tokens_str = str(result.get('tokens', 'N/A'))
        print(f"Q: {q['question'][:50]}")
        print(f"  TTFT: {ttft_str} ms | Total: {result['total_ms']:.0f} ms | Tokens: {tokens_str}")
        if result.get("error"):
            print(f"  ERROR: {result['error']}")
        if result.get("gate_rejected"):
            print(f"  GATE REJECTED (top_score={result.get('top_score', 0):.3f})")
        if result.get("cached"):
            print(f"  CACHE HIT")
    return results


if __name__ == "__main__":
    print("MofNet Baseline Benchmark")
    print("Model: llama3.2:1b")
    print("Server: http://localhost:8000")

    # Warm-up call
    print("\nWarming up...")
    ask_stream("Hello", 7, "science")
    time.sleep(2)

    # Baseline: streaming, default settings
    baseline = run_benchmark(
        "Streaming (default top_k=3, threshold=0.40)",
        QUESTIONS[:5],
        stream=True,
    )

    # Test top_k variations
    for tk in [1, 2, 3]:
        run_benchmark(
            f"Streaming top_k={tk}",
            QUESTIONS[:5],
            top_k=tk,
            stream=True,
        )

    # Test threshold variations
    for th in [0.30, 0.40, 0.50]:
        run_benchmark(
            f"Streaming threshold={th}",
            QUESTIONS[:5],
            confidence_threshold=th,
            stream=True,
        )

    # Non-streaming baseline
    run_benchmark(
        "Non-streaming (default)",
        QUESTIONS[:3],
        stream=False,
    )

    print("\nBaseline complete.")
