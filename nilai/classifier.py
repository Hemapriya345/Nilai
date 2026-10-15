"""Tremor vs. voluntary-movement classifier.

Core idea: a real tremor is *muscle-driven*, so the oscillation seen by the gyroscope
in the 3.5–12 Hz band is coherent with the EMG activation envelope. External
vibration (a moving vehicle, a power tool) shakes the gyro at a similar frequency
but the muscles are not producing it, so coherence stays low.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum

import numpy as np

from . import dsp
from .config import CONFIG, Config


class Label(str, Enum):
    REST = "rest"
    VOLUNTARY = "voluntary"
    TREMOR = "tremor"
    VIBRATION = "external_vibration"


@dataclass
class Features:
    gyro_rms: float
    tremor_band_ratio: float
    tremor_peak_hz: float
    emg_gyro_coherence: float
    emg_rms: float
    emg_median_hz: float

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass
class Result:
    label: Label
    tremor_score: float  # 0–100, severity of tremor in this window
    features: Features

    def as_dict(self) -> dict:
        return {"label": self.label.value, "tremor_score": round(self.tremor_score, 1), **self.features.as_dict()}


def extract_features(emg: np.ndarray, gx: np.ndarray, gy: np.ndarray, gz: np.ndarray, cfg: Config = CONFIG) -> Features:
    fs = cfg.fs
    g = dsp.gyro_principal(gx, gy, gz)
    env = dsp.emg_envelope(emg, fs, cfg.emg_band)
    f, p = dsp.welch_psd(g, fs)
    total = dsp.band_power(f, p, *cfg.motion_band) + 1e-12
    tb = dsp.band_power(f, p, *cfg.tremor_band)
    peak = dsp.peak_frequency(f, p, *cfg.tremor_band)
    g_t = dsp.bandpass(g, fs, *cfg.tremor_band)
    e_t = dsp.bandpass(env - env.mean(), fs, *cfg.tremor_band)
    return Features(
        gyro_rms=dsp.rms(g),
        tremor_band_ratio=tb / total,
        tremor_peak_hz=peak,
        emg_gyro_coherence=dsp.coherence_at(g_t, e_t, fs, peak),
        emg_rms=dsp.rms(dsp.bandpass(emg, fs, *cfg.emg_band)),
        emg_median_hz=dsp.median_frequency(emg, fs),
    )


def classify(ft: Features, cfg: Config = CONFIG) -> Result:
    if ft.gyro_rms < cfg.rest_gyro_rms:
        label = Label.REST
    elif ft.tremor_band_ratio >= cfg.tremor_band_ratio:
        label = Label.TREMOR if ft.emg_gyro_coherence >= cfg.coherence_min else Label.VIBRATION
    else:
        label = Label.VOLUNTARY
    score = 0.0
    if label is Label.TREMOR:
        # amplitude-weighted by how dominant the tremor band is; saturates at 100
        score = float(min(100.0, ft.gyro_rms * ft.tremor_band_ratio * 4.0))
    return Result(label, score, ft)


def analyse_window(emg, gx, gy, gz, cfg: Config = CONFIG) -> Result:
    return classify(extract_features(np.asarray(emg, float), np.asarray(gx, float), np.asarray(gy, float), np.asarray(gz, float), cfg), cfg)
