"""NILAI — tremor vs. intentional-movement analysis from forearm EMG + IMU."""
from .classifier import Label, analyse_window, classify, extract_features
from .pipeline import Pipeline, analyse_recording

__all__ = ["Label", "analyse_window", "classify", "extract_features", "Pipeline", "analyse_recording"]
__version__ = "0.1.0"
