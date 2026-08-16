"""Bowling-specific form analysis.

Metrics computed:
  1. Elbow extension  (arm horizontal → release)
  2. Front knee angle (at release)
  3. Shoulder-hip separation (at release)
"""

from __future__ import annotations

from sports.common import (
    LM,
    Point,
    compute_angle,
    compute_line_angle,
    angular_difference,
    lm_to_point,
    side_indices,
)


def analyze_bowling(
    landmarks_arm_horizontal: list[dict],
    landmarks_release: list[dict],
    arm_side: str,
    leg_side: str,
    thresholds: dict[str, tuple[float, float]],
    rules: dict[str, dict],
) -> list[dict]:
    """Analyze bowling form from two captured frames.

    Parameters
    ----------
    landmarks_arm_horizontal : 33 landmarks at the "arm horizontal" frame.
    landmarks_release : 33 landmarks at the "release" frame.
    arm_side : "left" or "right" — the bowling arm side.
    leg_side : "left" or "right" — the front leg side.
    thresholds : {metric_name: (min_val, max_val)} from DB.
    rules : {metric_name: {fault_name, injury_note, fix_tip}} from DB.

    Returns
    -------
    List of metric result dicts.
    """
    arm = side_indices(arm_side)
    leg = side_indices(leg_side)
    results: list[dict] = []

    # ── 1. Elbow extension ──────────────────────────────────────────────
    elbow_angle_horizontal = compute_angle(
        lm_to_point(landmarks_arm_horizontal[arm["shoulder"]]),
        lm_to_point(landmarks_arm_horizontal[arm["elbow"]]),
        lm_to_point(landmarks_arm_horizontal[arm["wrist"]]),
    )
    elbow_angle_release = compute_angle(
        lm_to_point(landmarks_release[arm["shoulder"]]),
        lm_to_point(landmarks_release[arm["elbow"]]),
        lm_to_point(landmarks_release[arm["wrist"]]),
    )
    elbow_extension = max(0.0, elbow_angle_release - elbow_angle_horizontal)

    lo, hi = thresholds.get("elbow_extension", (0, 15))
    flagged = elbow_extension < lo or elbow_extension > hi
    metric = {
        "metric_name": "elbow_extension",
        "display_name": "Elbow Extension",
        "value": round(elbow_extension, 1),
        "unit": "degrees",
        "min": lo,
        "max": hi,
        "flagged": flagged,
        "joints": [arm["shoulder"], arm["elbow"], arm["wrist"]],
    }
    if flagged and "elbow_extension" in rules:
        metric.update(rules["elbow_extension"])
    results.append(metric)

    # ── 2. Front knee angle ─────────────────────────────────────────────
    front_knee = compute_angle(
        lm_to_point(landmarks_release[leg["hip"]]),
        lm_to_point(landmarks_release[leg["knee"]]),
        lm_to_point(landmarks_release[leg["ankle"]]),
    )

    lo, hi = thresholds.get("front_knee_angle", (155, 180))
    flagged = front_knee < lo or front_knee > hi
    metric = {
        "metric_name": "front_knee_angle",
        "display_name": "Front Knee Angle",
        "value": round(front_knee, 1),
        "unit": "degrees",
        "min": lo,
        "max": hi,
        "flagged": flagged,
        "joints": [leg["hip"], leg["knee"], leg["ankle"]],
    }
    if flagged and "front_knee_angle" in rules:
        metric.update(rules["front_knee_angle"])
    results.append(metric)

    # ── 3. Shoulder-hip separation ──────────────────────────────────────
    shoulder_line_angle = compute_line_angle(
        lm_to_point(landmarks_release[LM.LEFT_SHOULDER]),
        lm_to_point(landmarks_release[LM.RIGHT_SHOULDER]),
    )
    hip_line_angle = compute_line_angle(
        lm_to_point(landmarks_release[LM.LEFT_HIP]),
        lm_to_point(landmarks_release[LM.RIGHT_HIP]),
    )
    separation = angular_difference(shoulder_line_angle, hip_line_angle)

    lo, hi = thresholds.get("shoulder_hip_separation", (20, 45))
    flagged = separation < lo or separation > hi
    metric = {
        "metric_name": "shoulder_hip_separation",
        "display_name": "Shoulder-Hip Separation",
        "value": round(separation, 1),
        "unit": "degrees",
        "min": lo,
        "max": hi,
        "flagged": flagged,
        "joints": [
            LM.LEFT_SHOULDER,
            LM.RIGHT_SHOULDER,
            LM.LEFT_HIP,
            LM.RIGHT_HIP,
        ],
    }
    if flagged and "shoulder_hip_separation" in rules:
        metric.update(rules["shoulder_hip_separation"])
    results.append(metric)

    return results
