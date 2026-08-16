import httpx
import json
import time
import sys
import statistics

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8001"

QUESTIONS = [
    {"question": "What is reproduction in plants?", "grade": 7, "subject": "science", "type": "good"},
    {"question": "What is cell structure?", "grade": 7, "subject": "science", "type": "good"},
    {"question": "What are natural numbers?", "grade": 6, "subject": "mathematics", "type": "good"},
    {"question": "What is photosynthesis?", "grade": 7, "subject": "science", "type": "bad"},
    {"question": "Explain quantum entanglement.", "grade": 7, "subject": "science", "type": "bad"},
    {"question": "What is the capital of France?", "grade": 7, "subject": "geography", "type": "bad"},
    {"question": "Describe the water cycle.", "grade": 7, "subject": "science", "type": "good"},
    {"question": "What are the different states of matter?", "grade": 7, "subject": "science", "type": "good"},
    {"question": "Explain the concept of force and motion.", "grade": 7, "subject": "science", "type": "good"},
    {"question": "What is the solar system?", "grade": 7, "subject": "science", "type": "good"},
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
        "question": question,
        "answer": full_answer,
        "tokens": tokens,
        "ttft_ms": ttft,
        "total_ms": total_ms,
        "error": error,
        "top_score": top_score,
        "type": "unknown",
    }


def run_benchmark(label, questions, **overrides):
    print(f"\n{'='*70}")
    print(f"BENCHMARK: {label}")
    print(f"{'='*70}")
    results = []
    for q in questions:
        result = ask_stream(q["question"], q["grade"], q["subject"], **overrides)
        result["type"] = q.get("type", "unknown")
        results.append(result)
        ttft_str = "{:.0f}".format(result["ttft_ms"]) if result["ttft_ms"] is not None else "N/A"
        tokens_str = str(result.get("tokens", "N/A"))
        status = "GATE REJECTED" if result.get("tokens", 0) == 0 and not result.get("error") else ""
        print(f"Q: {q['question'][:55]}")
        print(f"  TTFT: {ttft_str} ms | Total: {result['total_ms']:.0f} ms | Tokens: {tokens_str} | Score: {result.get('top_score', 0):.3f} {status}")
        if result.get("error"):
            print(f"  ERROR: {result['error']}")
    return results


def summarize(results, label):
    print(f"\n{'='*70}")
    print(f"SUMMARY: {label}")
    print(f"{'='*70}")
    
    successful = [r for r in results if not r.get("error") and r.get("tokens", 0) > 0]
    rejected = [r for r in results if not r.get("error") and r.get("tokens", 0) == 0]
    errors = [r for r in results if r.get("error")]
    
    print(f"Total questions: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Gate rejected: {len(rejected)}")
    print(f"Errors: {len(errors)}")
    
    if successful:
        ttfts = [r["ttft_ms"] for r in successful if r.get("ttft_ms") is not None]
        totals = [r["total_ms"] for r in successful]
        tok_per_secs = [r["tokens"] / (r["total_ms"] / 1000) for r in successful if r["total_ms"] > 0]
        
        if ttfts:
            print(f"TTFT - avg: {statistics.mean(ttfts):.0f}ms, median: {statistics.median(ttfts):.0f}ms, min: {min(ttfts):.0f}ms, max: {max(ttfts):.0f}ms")
        if totals:
            print(f"Total time - avg: {statistics.mean(totals):.0f}ms, median: {statistics.median(totals):.0f}ms")
        if tok_per_secs:
            print(f"Tokens/sec - avg: {statistics.mean(tok_per_secs):.1f}")
    
    # Accuracy check
    good_questions = [r for r in results if r.get("type") == "good"]
    bad_questions = [r for r in results if r.get("type") == "bad"]
    
    good_success = sum(1 for r in good_questions if r.get("tokens", 0) > 0 and not r.get("error"))
    bad_rejected = sum(1 for r in bad_questions if r.get("tokens", 0) == 0 and not r.get("error"))
    
    print(f"Accuracy (good questions answered): {good_success}/{len(good_questions)}")
    print(f"Hallucination protection (bad questions rejected): {bad_rejected}/{len(bad_questions)}")


if __name__ == "__main__":
    print("MofNet Final Optimization Benchmark")
    print("Model: llama3.2:1b")
    print("CPU: 2 cores")
    print("="*70)

    # Warm-up
    print("\nWarming up...")
    ask_stream("Hello", 7, "science")
    time.sleep(2)

    # Final benchmark with optimized configuration
    results = run_benchmark(
        "Optimized (top_k=3, np=96, nt=2, compact prompt)",
        QUESTIONS,
    )
    
    summarize(results, "Optimized Configuration")

    # Compare with top_k=2
    results_t2 = run_benchmark(
        "Comparison (top_k=2, np=96, nt=2)",
        QUESTIONS,
        top_k_override=2,
    )
    
    summarize(results_t2, "top_k=2 Configuration")

    print("\n" + "="*70)
    print("BENCHMARK COMPLETE")
    print("="*70)
