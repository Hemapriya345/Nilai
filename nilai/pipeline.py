"""Sliding-window pipeline: samples in → classification results out."""
from __future__ import annotations

from collections import deque
from typing import Iterable, Iterator

import numpy as np

from .classifier import Result, analyse_window
from .config import CONFIG, Config


class Pipeline:
    def __init__(self, cfg: Config = CONFIG):
        self.cfg = cfg
        self.buf = {k: deque(maxlen=cfg.window_n) for k in ("t", "emg", "gx", "gy", "gz")}
        self._since = 0

    def push(self, s: dict) -> Result | None:
        for k in self.buf:
            self.buf[k].append(s[k])
        self._since += 1
        if len(self.buf["t"]) == self.cfg.window_n and self._since >= self.cfg.hop_n:
            self._since = 0
            arr = {k: np.fromiter(v, float) for k, v in self.buf.items()}
            return analyse_window(arr["emg"], arr["gx"], arr["gy"], arr["gz"], self.cfg)
        return None

    def run(self, samples: Iterable[dict]) -> Iterator[tuple[dict, Result]]:
        for s in samples:
            r = self.push(s)
            if r is not None:
                yield s, r


def analyse_recording(data: dict[str, np.ndarray], cfg: Config = CONFIG) -> list[Result]:
    """Batch-analyse a whole recording (dict of equal-length arrays)."""
    n = len(data["emg"])
    out = []
    for start in range(0, n - cfg.window_n + 1, cfg.hop_n):
        sl = slice(start, start + cfg.window_n)
        out.append(analyse_window(data["emg"][sl], data["gx"][sl], data["gy"][sl], data["gz"][sl], cfg))
    return out
