"""NPG Lite EMG over BLE (optional — requires `pip install bleak`).

The NPG Lite streams packed ADC samples on a notify characteristic. Set
NILAI_BLE_ADDRESS and NILAI_BLE_CHAR_UUID for your board. This reader assumes
little-endian uint16 samples for channel 0; adjust `_decode` if your firmware
packs channels differently. Gyro values are 0 here; for full tremor-vs-intent analysis
use the ESP32 serial source, which carries EMG and IMU together.
"""
from __future__ import annotations

import asyncio
import queue
import struct
import threading
import time
from typing import Iterator

from .config import CONFIG, Config


def _decode(payload: bytes) -> list[float]:
    n = len(payload) // 2
    return [float(v) - 2048.0 for v in struct.unpack(f"<{n}H", payload[: n * 2])]


def from_ble(cfg: Config = CONFIG) -> Iterator[dict]:
    if not cfg.ble_address or not cfg.ble_char_uuid:
        raise RuntimeError("Set NILAI_BLE_ADDRESS and NILAI_BLE_CHAR_UUID to use the BLE source")
    from bleak import BleakClient

    q: "queue.Queue[float]" = queue.Queue()

    async def run():
        async with BleakClient(cfg.ble_address) as client:
            await client.start_notify(cfg.ble_char_uuid, lambda _h, data: [q.put(v) for v in _decode(data)])
            while True:
                await asyncio.sleep(1)

    threading.Thread(target=lambda: asyncio.run(run()), daemon=True).start()
    t0 = time.time()
    i = 0
    while True:
        v = q.get()
        yield {"t": t0 + i / cfg.fs, "emg": v, "gx": 0.0, "gy": 0.0, "gz": 0.0}
        i += 1
