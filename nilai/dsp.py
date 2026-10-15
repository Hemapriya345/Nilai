"""Signal-processing primitives for EMG + IMU tremor analysis."""
from __future__ import annotations

import numpy as np
from scipy import signal


def bandpass(x: np.ndarray, fs: float, lo: float, hi: float, order: int = 4) -> np.ndarray:
    hi = min(hi, 0.45 * fs)
    sos = signal.butter(order, [lo, hi], btype="bandpass", fs=fs, output="sos")
    return signal.sosfiltfilt(sos, x)


def lowpass(x: np.ndarray, fs: float, fc: float, order: int = 4) -> np.ndarray:
    sos = signal.butter(order, fc, btype="lowpass", fs=fs, output="sos")
    return signal.sosfiltfilt(sos, x)


def emg_envelope(emg: np.ndarray, fs: float, band=(20.0, 120.0), smooth_hz: float = 15.0) -> np.ndarray:
    """Band-pass, full-wave rectify and smooth raw EMG into an activation envelope."""
    return lowpass(np.abs(bandpass(emg, fs, *band)), fs, smooth_hz)


def gyro_principal(gx: np.ndarray, gy: np.ndarray, gz: np.ndarray) -> np.ndarray:
    """Project 3-axis angular velocity onto its dominant axis (PCA).

    Unlike the vector magnitude, this keeps the sign of the rotation, so a 6 Hz
    tremor stays at 6 Hz instead of being rectified to 12 Hz. It is also
    independent of how the pod is rotated on the forearm.
    """
    g = np.vstack([gx, gy, gz]).T
    g = g - g.mean(axis=0)
    _, _, vt = np.linalg.svd(g, full_matrices=False)
    return g @ vt[0]


def welch_psd(x: np.ndarray, fs: float, nperseg: int = 256):
    nperseg = min(nperseg, len(x))
    return signal.welch(x, fs=fs, nperseg=nperseg)


def band_power(f: np.ndarray, pxx: np.ndarray, lo: float, hi: float) -> float:
    m = (f >= lo) & (f <= hi)
    return float(np.trapezoid(pxx[m], f[m])) if m.any() else 0.0


def peak_frequency(f: np.ndarray, pxx: np.ndarray, lo: float, hi: float) -> float:
    m = (f >= lo) & (f <= hi)
    return float(f[m][np.argmax(pxx[m])]) if m.any() else 0.0


def coherence_at(a: np.ndarray, b: np.ndarray, fs: float, f0: float, half_width: float = 1.0,
                 nperseg: int | None = None) -> float:
    """Mean magnitude-squared coherence of a and b within f0 ± half_width Hz.

    Evaluated at the gyro's dominant tremor frequency rather than as a band
    maximum: with short windows the band maximum is biased upward by chance.
    """
    nperseg = min(nperseg or int(fs / 2), len(a) // 4)  # ~2 Hz resolution
    f, c = signal.coherence(a, b, fs=fs, nperseg=nperseg)
    m = np.abs(f - f0) <= half_width
    return float(c[m].mean()) if m.any() else 0.0


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(x))))


def median_frequency(x: np.ndarray, fs: float) -> float:
    """EMG median frequency — falls with muscle fatigue."""
    f, p = welch_psd(x, fs)
    c = np.cumsum(p)
    return float(f[np.searchsorted(c, c[-1] / 2)])
