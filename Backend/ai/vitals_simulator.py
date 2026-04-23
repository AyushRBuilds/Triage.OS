"""
Vitals Simulator
----------------
Generates realistic synthetic vital-sign streams for testing
the risk scorer and frontend dashboard.

Usage:
    from ai.vitals_simulator import stream_vitals
    for reading in stream_vitals(patient_id=1, steps=10):
        print(reading)
"""
import random
import time
from typing import Generator, Dict


BASELINE = {
    "heart_rate":          75.0,   # bpm
    "blood_pressure_sys":  120.0,  # mmHg
    "blood_pressure_dia":  80.0,   # mmHg
    "spo2":                98.0,   # %
    "temperature":         36.6,   # °C
}

NOISE = {
    "heart_rate":          5.0,
    "blood_pressure_sys":  8.0,
    "blood_pressure_dia":  5.0,
    "spo2":                1.5,
    "temperature":         0.3,
}


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def generate_reading(baseline: Dict = None, severity: float = 0.0) -> Dict:
    """
    Generate a single vitals reading.

    Args:
        baseline:  Base vital values (defaults to BASELINE).
        severity:  0.0 = healthy, 1.0 = critical (shifts values adversely).
    """
    b = baseline or BASELINE
    severity = _clamp(severity, 0.0, 1.0)

    reading = {
        "heart_rate":          _clamp(b["heart_rate"]         + random.gauss(20 * severity, NOISE["heart_rate"]),         30, 200),
        "blood_pressure_sys":  _clamp(b["blood_pressure_sys"] + random.gauss(40 * severity, NOISE["blood_pressure_sys"]), 60, 220),
        "blood_pressure_dia":  _clamp(b["blood_pressure_dia"] + random.gauss(20 * severity, NOISE["blood_pressure_dia"]), 40, 140),
        "spo2":                _clamp(b["spo2"]               - random.gauss(10 * severity, NOISE["spo2"]),               50, 100),
        "temperature":         _clamp(b["temperature"]        + random.gauss(2  * severity, NOISE["temperature"]),        35, 42),
    }
    return {k: round(v, 2) for k, v in reading.items()}


def stream_vitals(
    patient_id: int,
    steps: int = 20,
    interval_s: float = 1.0,
    severity: float = 0.0,
) -> Generator[Dict, None, None]:
    """Yield simulated vital readings at `interval_s` intervals."""
    for _ in range(steps):
        reading = generate_reading(severity=severity)
        reading["patient_id"] = patient_id
        yield reading
        time.sleep(interval_s)


if __name__ == "__main__":
    print("Simulating 5 readings for patient 1 (severity=0.5) …")
    for r in stream_vitals(patient_id=1, steps=5, interval_s=0.5, severity=0.5):
        print(r)
