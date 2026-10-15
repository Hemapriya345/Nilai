"""Command-line entry points.

  python -m nilai.cli analyse data/sample/tremor.csv     # per-window labels + summary
  python -m nilai.cli generate data/sample               # regenerate sample CSVs
  python -m nilai.cli dashboard                          # start the live dashboard
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from collections import Counter

import numpy as np

from . import synthetic
from .config import CONFIG
from .pipeline import analyse_recording


def load_csv(path: str) -> dict[str, np.ndarray]:
    cols: dict[str, list[float]] = {k: [] for k in ("t", "emg", "gx", "gy", "gz")}
    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            for k in cols:
                cols[k].append(float(row[k]))
    return {k: np.asarray(v) for k, v in cols.items()}


def cmd_analyse(args):
    data = load_csv(args.path)
    results = analyse_recording(data, CONFIG)
    counts = Counter(r.label.value for r in results)
    scores = [r.tremor_score for r in results if r.label.value == "tremor"]
    summary = {
        "file": args.path,
        "windows": len(results),
        "labels": dict(counts),
        "dominant": counts.most_common(1)[0][0] if counts else None,
        "mean_tremor_score": round(float(np.mean(scores)), 1) if scores else 0.0,
        "mean_tremor_hz": round(float(np.mean([r.features.tremor_peak_hz for r in results if r.label.value == "tremor"])), 2) if scores else None,
    }
    if args.verbose:
        for i, r in enumerate(results):
            print(json.dumps({"window": i, **r.as_dict()}))
    print(json.dumps(summary, indent=2))


def cmd_generate(args):
    os.makedirs(args.out, exist_ok=True)
    for sc in synthetic.SCENARIOS:
        d = synthetic.generate(sc, seconds=args.seconds, fs=CONFIG.fs, seed=42)
        path = os.path.join(args.out, f"{sc}.csv")
        with open(path, "w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["t", "emg", "gx", "gy", "gz"])
            for i in range(d["t"].size):
                w.writerow([f"{d['t'][i]:.4f}", f"{d['emg'][i]:.2f}", f"{d['gx'][i]:.3f}", f"{d['gy'][i]:.3f}", f"{d['gz'][i]:.3f}"])
        print("wrote", path)


def main():
    p = argparse.ArgumentParser(prog="nilai")
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("analyse", help="classify a recorded CSV")
    a.add_argument("path")
    a.add_argument("-v", "--verbose", action="store_true")
    a.set_defaults(func=cmd_analyse)
    g = sub.add_parser("generate", help="write synthetic sample CSVs")
    g.add_argument("out", nargs="?", default="data/sample")
    g.add_argument("--seconds", type=float, default=20.0)
    g.set_defaults(func=cmd_generate)
    d = sub.add_parser("dashboard", help="run the live dashboard")
    d.set_defaults(func=lambda _a: __import__("nilai.dashboard.app", fromlist=["main"]).main())
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
