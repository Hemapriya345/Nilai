"""Weighted-frequency Fourier Linear Combiner (Riviere et al., IEEE TBME 1998).

Tracks the instantaneous frequency and amplitude of a quasi-periodic tremor and
returns an estimate of it, so that `signal - estimate` keeps only intended motion.
Used for (a) the "steady twin" visualisation in the dashboard and (b) the phase
reference that a future suppression stage would need.
"""
from __future__ import annotations

import numpy as np


class WFLC:
    def __init__(self, fs: float, harmonics: int = 1, mu: float = 0.01, mu0: float = 0.0005,
                 mu_b: float = 0.0, f0: float = 6.0):
        self.fs = fs
        self.M = harmonics
        self.mu, self.mu0, self.mu_b = mu, mu0, mu_b
        self.w0 = 2 * np.pi * f0 / fs          # rad/sample
        self.w = np.zeros(2 * harmonics)
        self.phase = 0.0
        self.bias = 0.0

    @property
    def frequency_hz(self) -> float:
        return float(self.w0 * self.fs / (2 * np.pi))

    def step(self, s: float) -> float:
        self.phase += self.w0
        r = np.arange(1, self.M + 1)
        x = np.concatenate([np.sin(r * self.phase), np.cos(r * self.phase)])
        y = float(self.w @ x)
        err = s - y - self.bias
        # frequency update
        grad = np.sum(r * (self.w[: self.M] * x[self.M:] - self.w[self.M:] * x[: self.M]))
        self.w0 = float(np.clip(self.w0 + 2 * self.mu0 * err * grad, 2 * np.pi * 2 / self.fs, 2 * np.pi * 15 / self.fs))
        self.w += 2 * self.mu * x * err
        self.bias += self.mu_b * err
        return y

    def run(self, s: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Return (tremor_estimate, frequency_track_hz) for a whole signal."""
        est = np.empty_like(s, dtype=float)
        freq = np.empty_like(s, dtype=float)
        for i, v in enumerate(s):
            est[i] = self.step(float(v))
            freq[i] = self.frequency_hz
        return est, freq
