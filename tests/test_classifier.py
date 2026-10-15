from collections import Counter

import numpy as np
import pytest

from nilai import Label, analyse_recording, synthetic
from nilai.config import CONFIG


def dominant(scenario, seed=0, **kw):
    results = analyse_recording(synthetic.generate(scenario, seconds=12, seed=seed, **kw), CONFIG)
    counts = Counter(r.label for r in results)
    return counts.most_common(1)[0][0], counts, results


@pytest.mark.parametrize("seed", range(5))
def test_rest_is_rest(seed):
    assert dominant("rest", seed)[0] is Label.REST


@pytest.mark.parametrize("seed", range(5))
def test_voluntary_movement_not_flagged_as_tremor(seed):
    _, counts, _ = dominant("voluntary", seed)
    assert counts[Label.TREMOR] == 0


@pytest.mark.parametrize("hz", [4.5, 6.0, 8.0, 10.0])
def test_tremor_detected_across_frequencies(hz):
    label, counts, results = dominant("tremor", tremor_hz=hz)
    assert label is Label.TREMOR
    assert counts[Label.TREMOR] / sum(counts.values()) > 0.95
    peaks = [r.features.tremor_peak_hz for r in results]
    assert abs(np.median(peaks) - hz) < 1.0


@pytest.mark.parametrize("seed", range(5))
def test_external_vibration_rejected(seed):
    """Vehicle-like vibration at tremor frequency must not count as tremor."""
    label, counts, _ = dominant("vibration", seed)
    assert label is Label.VIBRATION
    assert counts[Label.TREMOR] / sum(counts.values()) < 0.05


def test_tremor_score_scales_with_amplitude():
    small = np.mean([r.tremor_score for r in dominant("tremor", amplitude=8)[2]])
    large = np.mean([r.tremor_score for r in dominant("tremor", amplitude=25)[2]])
    assert large > small > 0


def test_sample_csvs_classify_as_named():
    from pathlib import Path
    from nilai.cli import load_csv

    root = Path(__file__).resolve().parents[1] / "data" / "sample"
    expected = {"rest": Label.REST, "voluntary": Label.VOLUNTARY, "tremor": Label.TREMOR, "vibration": Label.VIBRATION}
    for name, lab in expected.items():
        results = analyse_recording(load_csv(str(root / f"{name}.csv")), CONFIG)
        assert Counter(r.label for r in results).most_common(1)[0][0] is lab, name
