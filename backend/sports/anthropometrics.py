"""Anthropometric Normalization & Adaptive Human Body Calibration Engine.

Calculates individual human body proportions (torso-to-femur ratio, limb lengths,
spine tilt baseline) from BlazePose 33-point landmarks and dynamically adapts
biomechanical reference thresholds for any human body type.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List
from sports.common import LM, compute_angle, lm_to_point, Point, side_indices


def calculate_anthropometrics(landmarks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract human body proportions from 33 BlazePose landmarks.

    Parameters
    ----------
    landmarks : List of 33 landmark dicts with {x, y, z, visibility}.

    Returns
    -------
    Dict containing anthropometric measurements, ratios, and human classification.
    """
    # Use higher visibility side or average
    l_shoulder = lm_to_point(landmarks[LM.LEFT_SHOULDER])
    r_shoulder = lm_to_point(landmarks[LM.RIGHT_SHOULDER])
    l_hip = lm_to_point(landmarks[LM.LEFT_HIP])
    r_hip = lm_to_point(landmarks[LM.RIGHT_HIP])
    l_knee = lm_to_point(landmarks[LM.LEFT_KNEE])
    r_knee = lm_to_point(landmarks[LM.RIGHT_KNEE])
    l_ankle = lm_to_point(landmarks[LM.LEFT_ANKLE])
    r_ankle = lm_to_point(landmarks[LM.RIGHT_ANKLE])

    # Midpoints
    mid_shoulder = Point((l_shoulder.x + r_shoulder.x) / 2.0, (l_shoulder.y + r_shoulder.y) / 2.0)
    mid_hip = Point((l_hip.x + r_hip.x) / 2.0, (l_hip.y + r_hip.y) / 2.0)
    mid_knee = Point((l_knee.x + r_knee.x) / 2.0, (l_knee.y + r_knee.y) / 2.0)
    mid_ankle = Point((l_ankle.x + r_ankle.x) / 2.0, (l_ankle.y + r_ankle.y) / 2.0)

    # Segment lengths (2D Euclidean in normalized coords)
    torso_length = math.hypot(mid_shoulder.x - mid_hip.x, mid_shoulder.y - mid_hip.y)
    femur_length = math.hypot(mid_hip.x - mid_knee.x, mid_hip.y - mid_knee.y)
    tibia_length = math.hypot(mid_knee.x - mid_ankle.x, mid_knee.y - mid_ankle.y)

    # Arm length
    l_wrist = lm_to_point(landmarks[LM.LEFT_WRIST])
    r_wrist = lm_to_point(landmarks[LM.RIGHT_WRIST])
    arm_length = (
        math.hypot(l_shoulder.x - l_wrist.x, l_shoulder.y - l_wrist.y) +
        math.hypot(r_shoulder.x - r_wrist.x, r_shoulder.y - r_wrist.y)
    ) / 2.0

    # Ratios
    torso_femur_ratio = round(torso_length / max(0.001, femur_length), 2)
    arm_torso_ratio = round(arm_length / max(0.001, torso_length), 2)

    # Human lever classification for Deadlift / Hinge
    if torso_femur_ratio < 0.85:
        lever_type = "Long Femurs / Short Torso"
        deadlift_biomechanics_note = (
            "Longer thigh levers require deeper hip hinge setup angle; hips sit higher naturally."
        )
    elif torso_femur_ratio > 1.15:
        lever_type = "Short Femurs / Long Torso"
        deadlift_biomechanics_note = (
            "Longer torso allows upright setup position; lower lumbar shear forces."
        )
    else:
        lever_type = "Balanced Proportions"
        deadlift_biomechanics_note = "Standard biomechanical leverage distribution."

    return {
        "torso_length": round(torso_length, 3),
        "femur_length": round(femur_length, 3),
        "tibia_length": round(tibia_length, 3),
        "arm_length": round(arm_length, 3),
        "torso_femur_ratio": torso_femur_ratio,
        "arm_torso_ratio": arm_torso_ratio,
        "lever_type": lever_type,
        "note": deadlift_biomechanics_note,
    }


def adapt_thresholds_for_human(
    sport: str,
    base_thresholds: Dict[str, tuple[float, float]],
    anthropometrics: Dict[str, Any],
) -> Dict[str, tuple[float, float]]:
    """Dynamically adapt reference thresholds based on subject's unique body structure.

    Parameters
    ----------
    sport : "deadlift" or "bowling".
    base_thresholds : Base database reference ranges.
    anthropometrics : Subject's calculated body ratios.

    Returns
    -------
    Adapted thresholds dict personalized for this specific human.
    """
    adapted = dict(base_thresholds)

    if sport.lower() == "deadlift":
        tf_ratio = anthropometrics.get("torso_femur_ratio", 1.0)

        # Long femurs (tf_ratio < 0.85) naturally require slightly more hip bend at lockout
        # and different rise ratio tolerances
        if tf_ratio < 0.85:
            # Widen rise ratio allowance for long femurs
            lo, hi = adapted.get("hip_shoulder_rise_ratio", (0.6, 1.4))
            adapted["hip_shoulder_rise_ratio"] = (round(lo * 0.9, 2), round(hi * 1.15, 2))

            # Hip lockout angle tolerance adapted for long femurs
            h_lo, h_hi = adapted.get("hip_lockout_angle", (160, 180))
            adapted["hip_lockout_angle"] = (max(152.0, h_lo - 5.0), h_hi)

        elif tf_ratio > 1.15:
            # Short femurs allow tighter rise ratio tolerance
            lo, hi = adapted.get("hip_shoulder_rise_ratio", (0.6, 1.4))
            adapted["hip_shoulder_rise_ratio"] = (round(lo * 1.05, 2), round(hi * 0.95, 2))

    return adapted
