import numpy as np

from nilai import dsp
from nilai.wflc import WFLC

FS = 250.0


def test_gyro_principal_keeps_frequency():
    t = np.arange(int(4 * FS)) / FS
    s = np.sin(2 * np.pi * 6 * t)
    g = dsp.gyro_principal(s, 0.5 * s, -0.2 * s)
    f, p = dsp.welch_psd(g, FS)
    assert abs(dsp.peak_frequency(f, p, 1, 20) - 6) < 1


def test_coherence_high_for_related_low_for_unrelated():
    rng = np.random.default_rng(1)
    t = np.arange(int(3 * FS)) / FS
    a = np.sin(2 * np.pi * 6 * t) + 0.2 * rng.normal(size=t.size)
    b = np.sin(2 * np.pi * 6 * t + 0.5) + 0.2 * rng.normal(size=t.size)
    c = rng.normal(size=t.size)
    assert dsp.coherence_at(a, b, FS, 6) > 0.8
    assert dsp.coherence_at(a, c, FS, 6) < 0.5


def test_median_frequency_drops_with_lowpassed_emg():
    rng = np.random.default_rng(2)
    x = rng.normal(size=int(4 * FS))
    fresh = dsp.bandpass(x, FS, 20, 120)
    fatigued = dsp.bandpass(x, FS, 20, 60)
    assert dsp.median_frequency(fatigued, FS) < dsp.median_frequency(fresh, FS)


def test_wflc_tracks_and_removes_tremor():
    t = np.arange(int(10 * FS)) / FS
    tremor = 10 * np.sin(2 * np.pi * 7.0 * t)
    intended = 30 * np.sin(2 * np.pi * 0.5 * t)
    g_t = dsp.bandpass(tremor + intended, FS, 3.5, 12)
    est, freq = WFLC(FS, f0=5.0).run(g_t)
    settled = slice(int(4 * FS), None)
    assert abs(np.median(freq[settled]) - 7.0) < 0.5
    residual = g_t[settled] - est[settled]
    assert dsp.rms(residual) < 0.3 * dsp.rms(g_t[settled])
