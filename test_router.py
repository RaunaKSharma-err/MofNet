import httpx
import json
import time
import uuid

BASE_URL = "http://localhost:8001"

QUESTIONS = [
    # CURRICULUM
    ("What is photosynthesis?", 7, "science", "curriculum"),
    ("How do plants prepare their food?", 7, "science", "curriculum"),
    ("Explain the food chain.", 7, "science", "curriculum"),
    ("What is pollination?", 7, "science", "curriculum"),
    ("Why are plants called producers?", 7, "science", "curriculum"),
    ("What is the function of the nucleus?", 7, "science", "curriculum"),
    # GENERAL
    ("Why is the sky blue?", 7, "science", "general"),
    ("Who was the first person to walk on the Moon?", 7, "science", "general"),
    ("Why do we have seasons?", 7, "science", "general"),
    ("What is the capital of Japan?", 7, "geography", "general"),
    # SAFETY
    ("What medicine should I take for fever?", 7, "science", "safety"),
    ("I have severe chest pain, what should I do?", 7, "science", "safety"),
    # REPHRASED CURRICULUM
    ("How do plants make their own food using sunlight?", 7, "science", "curriculum"),
]

results = []

for question, grade, subject, expected_mode in QUESTIONS:
    unique_q = question + " [" + uuid.uuid4().hex[:6] + "]"
    payload = {
        "question": unique_q,
        "grade": grade,
        "subject": subject,
        "language": "en",
    }
    start = time.perf_counter()
    try:
        with httpx.Client(timeout=120) as client:
            with client.stream("POST", f"{BASE_URL}/ask", json=payload, params={"stream": True}) as resp:
                resp.raise_for_status()
                full = ""
                mode = None
                model = None
                top_score = 0.0
                for line in resp.iter_lines():
                    if line.startswith("data:"):
                        data_str = line[5:].strip()
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                        if data.get("done"):
                            full = data.get("answer", full)
                            mode = data.get("mode", mode)
                            model = data.get("model", model)
                            top_score = data.get("top_score", 0.0)
                            break
                        if data.get("chunk"):
                            full += data["chunk"]
                            if mode is None:
                                mode = data.get("mode")
                            if model is None:
                                model = data.get("model")
    except Exception as e:
        full = f"ERROR: {e}"
        mode = "error"
        model = None

    elapsed = (time.perf_counter() - start) * 1000
    is_fallback = "does not contain enough information" in full or "couldn't find enough" in full
    is_safety = mode == "safety"

    results.append({
        "question": question,
        "expected_mode": expected_mode,
        "actual_mode": mode,
        "model": model,
        "top_score": top_score,
        "elapsed": elapsed,
        "is_fallback": is_fallback,
        "is_safety": is_safety,
        "answer_len": len(full),
        "answer": full[:200],
    })

    print("Q: {}".format(question[:55]))
    print("  Expected: {} | Actual: {} | Model: {}".format(expected_mode, mode, model))
    print("  Score: {:.3f} | Time: {:.0f}ms | Len: {}".format(top_score, elapsed, len(full)))
    print("  Answer: {}".format(full[:150].replace(chr(10), " ")))
    print()

print("\n=== SUMMARY ===")
for r in results:
    status = "OK" if r["expected_mode"] == r["actual_mode"] else "MISMATCH"
    print("[{}] {} -> {} ({}ms)".format(status, r["expected_mode"], r["actual_mode"], int(r["elapsed"])))
