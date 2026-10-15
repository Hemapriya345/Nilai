"""Runtime configuration, read from environment variables (see .env.example)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


@dataclass(frozen=True)
class Config:
    # Sampling
    fs: float = float(_env("NILAI_FS", "250"))               # Hz, common rate after acquisition
    window_s: float = float(_env("NILAI_WINDOW_S", "3.0"))   # analysis window length
    hop_s: float = float(_env("NILAI_HOP_S", "0.5"))         # step between windows

    # Bands (Hz)
    tremor_band: tuple[float, float] = (3.5, 12.0)
    motion_band: tuple[float, float] = (0.3, 20.0)
    emg_band: tuple[float, float] = (20.0, 120.0)

    # Decision thresholds
    rest_gyro_rms: float = float(_env("NILAI_REST_GYRO_RMS", "2.0"))        # deg/s
    tremor_band_ratio: float = float(_env("NILAI_TREMOR_BAND_RATIO", "0.5"))
    coherence_min: float = float(_env("NILAI_COHERENCE_MIN", "0.6"))

    # Acquisition
    source: str = _env("NILAI_SOURCE", "synthetic")          # synthetic | csv | serial | ble
    serial_port: str = _env("NILAI_SERIAL_PORT", "/dev/ttyUSB0")
    serial_baud: int = int(_env("NILAI_SERIAL_BAUD", "115200"))
    csv_path: str = _env("NILAI_CSV_PATH", "data/sample/tremor.csv")
    ble_address: str = _env("NILAI_BLE_ADDRESS", "")
    ble_char_uuid: str = _env("NILAI_BLE_CHAR_UUID", "")

    # Dashboard
    host: str = _env("NILAI_HOST", "127.0.0.1")
    port: int = int(_env("NILAI_PORT", "5000"))

    @property
    def window_n(self) -> int:
        return int(self.window_s * self.fs)

    @property
    def hop_n(self) -> int:
        return int(self.hop_s * self.fs)


CONFIG = Config()
