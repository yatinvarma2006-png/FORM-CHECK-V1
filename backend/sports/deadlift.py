"""Deadlift-specific form analysis.

Metrics computed:
  1. Hip-shoulder rise ratio  (setup → early pull, if early pull frame captured)
  2. Hip lockout angle        (at lockout)
  3. Knee lockout angle       (at lockout)
"""

from __future__ import annotations

from typing import Optional
from sports.common import (
    compute_angle,
    lm_to_point,
    side_indices,
)


def _pick_visible_side(landmarks: list[dict]) -> str:
    """Pick the side with higher average visibility for hip/knee/ankle."""
    left_vis = sum(
        landmarks[i]["visibility"] for i in [23, 25, 27]
    ) / 3
    right_vis = sum(
        landmarks[i]["visibility"] for i in [24, 26, 28]
    ) / 3
    return "left" if left_vis >= right_vis else "right"


def analyze_deadlift(
    landmarks_setup: list[dict],
    landmarks_early_pull: Optional[list[dict]],
    landmarks_lockout: list[dict],
    thresholds: dict[str, tuple[float, float]],
    rules: dict[str, dict],
) -> list[dict]:
    """Analyze deadlift form.

    Parameters
    ----------
    landmarks_setup : 33 landmarks at the "setup" frame (bar on floor).
    landmarks_early_pull : 33 landmarks at the "early pull" frame (~20% up), optional.
    landmarks_lockout : 33 landmarks at the "lockout" frame (standing).
    thresholds : {metric_name: (min_val, max_val)} from DB.
    rules : {metric_name: {fault_name, injury_note, fix_tip}} from DB.

    Returns
    -------
    List of metric result dicts.
    """
    # Use whichever side is more visible
    side = _pick_visible_side(landmarks_setup)
    idx = side_indices(side)
    results: list[dict] = []

    # ── 1. Hip-shoulder rise ratio (if early_pull provided) ───────────────
    if landmarks_early_pull:
        hip_rise = landmarks_setup[idx["hip"]]["y"] - landmarks_early_pull[idx["hip"]]["y"]
        shoulder_rise = (
            landmarks_setup[idx["shoulder"]]["y"]
            - landmarks_early_pull[idx["shoulder"]]["y"]
        )

        if abs(shoulder_rise) < 1e-6:
            ratio = 0.0
        else:
            ratio = hip_rise / shoulder_rise

        lo, hi = thresholds.get("hip_shoulder_rise_ratio", (0.8, 1.2))
        flagged = ratio < lo or ratio > hi
        metric = {
            "metric_name": "hip_shoulder_rise_ratio",
            "display_name": "Hip-Shoulder Rise Ratio",
            "value": round(ratio, 2),
            "unit": "ratio",
            "min": lo,
            "max": hi,
            "flagged": flagged,
            "joints": [idx["hip"], idx["shoulder"]],
        }
        if flagged and "hip_shoulder_rise_ratio" in rules:
            metric.update(rules["hip_shoulder_rise_ratio"])
        results.append(metric)

    # ── 2. Hip lockout angle ────────────────────────────────────────────
    hip_lockout = compute_angle(
        lm_to_point(landmarks_lockout[idx["shoulder"]]),
        lm_to_point(landmarks_lockout[idx["hip"]]),
        lm_to_point(landmarks_lockout[idx["knee"]]),
    )

    lo, hi = thresholds.get("hip_lockout_angle", (165, 180))
    flagged = hip_lockout < lo or hip_lockout > hi
    metric = {
        "metric_name": "hip_lockout_angle",
        "display_name": "Hip Lockout Angle",
        "value": round(hip_lockout, 1),
        "unit": "degrees",
        "min": lo,
        "max": hi,
        "flagged": flagged,
        "joints": [idx["shoulder"], idx["hip"], idx["knee"]],
    }
    if flagged and "hip_lockout_angle" in rules:
        metric.update(rules["hip_lockout_angle"])
    results.append(metric)

    # ── 3. Knee lockout angle ───────────────────────────────────────────
    knee_lockout = compute_angle(
        lm_to_point(landmarks_lockout[idx["hip"]]),
        lm_to_point(landmarks_lockout[idx["knee"]]),
        lm_to_point(landmarks_lockout[idx["ankle"]]),
    )

    lo, hi = thresholds.get("knee_lockout_angle", (170, 180))
    flagged = knee_lockout < lo or knee_lockout > hi
    metric = {
        "metric_name": "knee_lockout_angle",
        "display_name": "Knee Lockout Angle",
        "value": round(knee_lockout, 1),
        "unit": "degrees",
        "min": lo,
        "max": hi,
        "flagged": flagged,
        "joints": [idx["hip"], idx["knee"], idx["ankle"]],
    }
    if flagged and "knee_lockout_angle" in rules:
        metric.update(rules["knee_lockout_angle"])
    results.append(metric)

    return results
