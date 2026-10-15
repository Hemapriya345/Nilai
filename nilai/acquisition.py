"""Data sources. Every source yields dict samples {t, emg, gx, gy, gz}.

serial : ESP32 + MPU6050 (+ analog EMG) streaming CSV lines over USB
         (see firmware/esp32_imu_stream). Format: t_ms,emg,gx,gy,gz
ble    : NPG Lite (Upside Down Labs) EMG over BLE. Characteristic UUID and the
         byte layout are configured via env vars — check your board's firmware.
csv    : replay a recorded session (data/sample/*.csv)
synthetic : generated scenarios for demos/tests
"""
from __future__ import annotations

import csv
import time
from typing import Iterator

from .config import CONFIG, Config
from . import synthetic

Sample = dict


def from_csv(path: str, realtime: bool = False, fs: float = CONFIG.fs) -> Iterator[Sample]:
    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            yield {k: float(row[k]) for k in ("t", "emg", "gx", "gy", "gz")}
            if realtime:
                time.sleep(1.0 / fs)


def from_synthetic(scenario: str = "tremor", loop: bool = True, realtime: bool = True, cfg: Config = CONFIG) -> Iterator[Sample]:
    order = [scenario] if scenario != "cycle" else list(synthetic.SCENARIOS)
    seed = 0
    t0 = 0.0
    while True:
        for sc in order:
            d = synthetic.generate(sc, seconds=8, fs=cfg.fs, seed=seed)
            for i in range(d["t"].size):
                yield {"t": t0 + d["t"][i], "emg": d["emg"][i], "gx": d["gx"][i], "gy": d["gy"][i], "gz": d["gz"][i], "truth": sc}
                if realtime:
                    time.sleep(1.0 / cfg.fs)
            t0 += d["t"][-1]
            seed += 1
        if not loop:
            return


def from_serial(cfg: Config = CONFIG) -> Iterator[Sample]:
    import serial  # pyserial

    with serial.Serial(cfg.serial_port, cfg.serial_baud, timeout=1) as ser:
        while True:
            line = ser.readline().decode(errors="ignore").strip()
            parts = line.split(",")
            if len(parts) != 5:
                continue
            try:
                t_ms, emg, gx, gy, gz = map(float, parts)
            except ValueError:
                continue
            yield {"t": t_ms / 1000.0, "emg": emg, "gx": gx, "gy": gy, "gz": gz}


def get_source(cfg: Config = CONFIG, **kw) -> Iterator[Sample]:
    if cfg.source == "serial":
        return from_serial(cfg)
    if cfg.source == "csv":
        return from_csv(cfg.csv_path, realtime=kw.get("realtime", True), fs=cfg.fs)
    if cfg.source == "ble":
        from .ble import from_ble  # optional dependency (bleak)
        return from_ble(cfg)
    return from_synthetic(kw.get("scenario", "cycle"), realtime=kw.get("realtime", True), cfg=cfg)
