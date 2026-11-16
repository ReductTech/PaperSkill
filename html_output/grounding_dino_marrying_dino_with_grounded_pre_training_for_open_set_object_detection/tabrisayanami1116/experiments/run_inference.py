"""Run pinned Grounding DINO Tiny on every recorded image/prompt pair."""
import argparse
import hashlib
import json
import math
import os
import platform
import time
from pathlib import Path

import PIL
import torch
import transformers
from PIL import Image
from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor

MODEL = "IDEA-Research/grounding-dino-tiny"
REVISION = "a2bb814dd30d776dcf7e30523b00659f4f141c71"
HERE = Path(__file__).resolve().parent

def sha256(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()

def compact(value, depth=0):
    if depth >= 4 or not isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    pad, inner = "  " * depth, "  " * (depth + 1)
    if isinstance(value, list):
        return "[\n" + ",\n".join(inner + compact(item, depth + 1) for item in value) + "\n" + pad + "]"
    return "{\n" + ",\n".join(inner + json.dumps(key, ensure_ascii=False) + ": " + compact(item, depth + 1)
                            for key, item in value.items()) + "\n" + pad + "}"

def run():
    arg = argparse.ArgumentParser(description=__doc__)
    arg.add_argument("--photos", type=Path, default=HERE.parent / "public" / "images")
    arg.add_argument("--out", type=Path, default=HERE)
    arg.add_argument("--local-model", type=Path)
    arg.add_argument("--threads", type=int, default=min(os.cpu_count() or 1, 6))
    args = arg.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(args.threads)
    config = json.loads((HERE / "cases.json").read_text(encoding="utf-8"))
    load_from = args.local_model or MODEL
    kwargs = {} if args.local_model else {"revision": REVISION}
    processor = AutoProcessor.from_pretrained(load_from, use_fast=True, **kwargs)
    model = AutoModelForZeroShotObjectDetection.from_pretrained(load_from, use_safetensors=True, **kwargs).eval()
    weight = ((args.local_model / "model.safetensors") if args.local_model else
              Path(transformers.utils.hub.cached_file(MODEL, "model.safetensors", revision=REVISION)))
    images = {}
    inputs_by_key = {}
    for image_id, info in config["images"].items():
        path = args.photos / info["file"]
        photo = Image.open(path).convert("RGB")
        images[image_id] = {**info, "width": photo.width, "height": photo.height, "sha256": sha256(path)}
        inputs_by_key[image_id] = photo

    runs = []
    for image_id, title, prompt, target_ids in config["cases"]:
        photo = inputs_by_key[image_id]
        data = processor(images=photo, text=prompt, return_tensors="pt")
        ids = data["input_ids"][0]
        tokens = processor.tokenizer.convert_ids_to_tokens(ids.tolist())
        start = time.perf_counter()
        with torch.inference_mode():
            output = model(**data)
        elapsed = round((time.perf_counter() - start) * 1000)
        valid = output.logits[0, :, :len(ids)].float()
        padded = output.logits[0, :, len(ids):]
        assert (padded < -1e6).all() and len(valid) == 900
        scores = valid.sigmoid().amax(dim=-1)
        cx, cy, bw, bh = output.pred_boxes[0].float().unbind(-1)
        pixel = torch.stack(((cx - bw/2) * photo.width, (cy - bh/2) * photo.height,
                             (cx + bw/2) * photo.width, (cy + bh/2) * photo.height), dim=-1)
        official = processor.post_process_grounded_object_detection(
            output, data["input_ids"], threshold=0.35, text_threshold=0.25,
            target_sizes=[(photo.height, photo.width)])[0]
        keep = scores > 0.35
        torch.testing.assert_close(scores[keep], official["scores"])
        torch.testing.assert_close(pixel[keep], official["boxes"])
        rows = [[index, box, score, [number if math.isfinite(number) else None for number in logits]]
                for index, (box, score, logits) in enumerate(zip(pixel.tolist(), scores.tolist(), valid.tolist(), strict=True))]
        runs.append({"image":image_id,"title":title,"prompt":prompt,"targets":target_ids,
                     "inputSize":list(data["pixel_values"].shape[-2:]),"tokens":tokens,"timeMs":elapsed,
                     "predictions":rows,"labelsAt035And025":official.get("text_labels", official["labels"])})
        ranked = sorted(rows, key=lambda row: -row[2])
        hit = [[round(iou(row[1], images[image_id]["targets"][key]), 2) for key in target_ids] for row in ranked[:3]]
        print(image_id, prompt, elapsed, len(official["scores"]), [round(row[2], 4) for row in ranked[:3]], hit, flush=True)
    report = {"model":MODEL, "revision":REVISION,"weightsSha256":sha256(weight),
              "environment":{"python":platform.python_version(),"torch":str(torch.__version__),
                             "transformers":transformers.__version__,"pillow":PIL.__version__,
                             "device":"CPU","threads":args.threads},
              "predictionColumns":["queryIndex","pixelXYXY","boxScore","validTokenLogits"],
              "images":images, "runs":runs}
    (args.out / "results.json").write_text(compact(report) + "\n", encoding="utf-8")

if __name__ == "__main__":
    run()
