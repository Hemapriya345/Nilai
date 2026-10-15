"""Live dashboard: Flask + Server-Sent Events.

Run:  python -m nilai.dashboard.app            (synthetic demo, cycles all scenarios)
      NILAI_SOURCE=serial python -m nilai.dashboard.app   (ESP32 over USB)
"""
from __future__ import annotations

import json
import threading
from collections import deque

import numpy as np
from flask import Flask, Response, jsonify, render_template

from .. import dsp
from ..acquisition import get_source
from ..config import CONFIG
from ..pipeline import Pipeline
from ..wflc import WFLC

app = Flask(__name__)

_state = {"latest": None, "history": deque(maxlen=240)}
_subscribers: list[deque] = []
_lock = threading.Lock()


def _worker():
    pipe = Pipeline(CONFIG)
    for sample, res in pipe.run(get_source(CONFIG)):
        arr = {k: np.fromiter(v, float) for k, v in pipe.buf.items()}
        g = dsp.gyro_principal(arr["gx"], arr["gy"], arr["gz"])
        g_t = dsp.bandpass(g, CONFIG.fs, *CONFIG.tremor_band)
        est, _ = WFLC(CONFIG.fs, f0=res.features.tremor_peak_hz or 6.0).run(g_t)
        steady = g - est if res.label.value == "tremor" else g
        step = 3  # decimate for the browser
        msg = {
            **res.as_dict(),
            "t": round(sample["t"], 2),
            "truth": sample.get("truth"),
            "emg": np.round(arr["emg"][::step], 1).tolist(),
            "gyro": np.round(g[::step], 2).tolist(),
            "steady": np.round(steady[::step], 2).tolist(),
        }
        with _lock:
            _state["latest"] = msg
            _state["history"].append({"t": msg["t"], "label": msg["label"], "score": msg["tremor_score"]})
            for q in _subscribers:
                q.append(msg)


@app.route("/")
def index():
    return render_template("index.html", source=CONFIG.source)


@app.route("/api/latest")
def latest():
    return jsonify(_state["latest"] or {})


@app.route("/api/history")
def history():
    return jsonify(list(_state["history"]))


@app.route("/stream")
def stream():
    q: deque = deque(maxlen=4)
    with _lock:
        _subscribers.append(q)

    def gen():
        import time
        try:
            while True:
                if q:
                    yield f"data: {json.dumps(q.popleft())}\n\n"
                else:
                    time.sleep(0.05)
        finally:
            with _lock:
                _subscribers.remove(q)

    return Response(gen(), mimetype="text/event-stream")


def main():
    threading.Thread(target=_worker, daemon=True).start()
    print(f"NILAI dashboard on http://{CONFIG.host}:{CONFIG.port}  (source={CONFIG.source})")
    app.run(host=CONFIG.host, port=CONFIG.port, threaded=True)


if __name__ == "__main__":
    main()
