"""Extract the lossless subset used by the browser, including all scores above 0.10."""
import json
from pathlib import Path

def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    report = json.loads(args.source.read_text(encoding="utf-8"))
    rows = []
    for run in report["runs"]:
        image, name, prompt, target_ids = (run[field] for field in ["image", "title", "prompt", "targets"])
        predictions = sorted(run["predictions"], key=lambda x: (-x[2], x[0]))
        rows.append({
            "image": image, "name": name, "prompt": prompt, "targetIds": target_ids,
            "tokens": run["tokens"], "predictions": [
                p for i, p in enumerate(predictions) if p[2] > 0.10 or i == 0
            ],
        })
    data = {"images": report["images"], "runs": rows}
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(rows)} inputs, {sum(len(r['predictions']) for r in rows)} preserved queries above display floor or top-ranked")
if __name__ == "__main__":
    main()
