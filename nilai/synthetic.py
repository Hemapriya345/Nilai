"""Synthetic EMG + gyro generator used for sample data, tests and offline demos.

Each scenario mimics a real condition the classifier must handle:
  rest       – arm still, low EMG
  voluntary  – slow reach/lift (0.3–1.5 Hz), sustained EMG
  tremor     – 4–8 Hz oscillation whose EMG bursts drive the motion (coherent)
  vibration  – 6 Hz shaking from outside (vehicle), EMG unrelated to it
"""
from __future__ import annotations

import numpy as np

SCENARIOS = ("rest", "voluntary", "tremor", "vibration")


def generate(scenario: str, seconds: float = 10.0, fs: float = 250.0, tremor_hz: float = 5.5,
             amplitude: float = 25.0, seed: int | None = 0) -> dict[str, np.ndarray]:
    if scenario not in SCENARIOS:
        raise ValueError(f"unknown scenario {scenario!r}; choose from {SCENARIOS}")
    rng = np.random.default_rng(seed)
    t = np.arange(int(seconds * fs)) / fs
    noise_g = lambda: rng.normal(0, 0.4, t.size)  # noqa: E731  gyro noise, deg/s
    carrier = rng.normal(0, 1, t.size)            # raw EMG is band-limited noise

    if scenario == "rest":
        drive = np.zeros_like(t)
        act = 0.05 * np.ones_like(t)
    elif scenario == "voluntary":
        drive = amplitude * 1.6 * np.sin(2 * np.pi * 0.6 * t) + amplitude * 0.8 * np.sin(2 * np.pi * 1.3 * t + 1)
        act = 0.4 + 0.3 * np.abs(np.sin(2 * np.pi * 0.6 * t))
    elif scenario == "tremor":
        f_inst = tremor_hz + 0.3 * np.sin(2 * np.pi * 0.1 * t)
        ph = 2 * np.pi * np.cumsum(f_inst) / fs
        drive = amplitude * np.sin(ph)
        act = 0.25 + 0.25 * (1 + np.sin(ph - 0.6))  # bursts lead the motion slightly
    else:  # vibration
        drive = amplitude * np.sin(2 * np.pi * 6.0 * t)
        act = 0.15 + 0.05 * np.abs(np.sin(2 * np.pi * 0.2 * t))

    emg = act * carrier * 300.0 + rng.normal(0, 5, t.size)  # µV-like scale
    gx = drive + noise_g()
    gy = 0.5 * drive + noise_g()
    gz = 0.2 * drive + noise_g()
    return {"t": t, "emg": emg, "gx": gx, "gy": gy, "gz": gz}
