"""Universal Human Somatotype & Anthropometric Adaptability Engine (v2.0).

Calculates body build characteristics (Endomorph / Heavy Build, Ectomorph / Tall Build,
Mesomorph / Athletic Build) and stance width ratios from BlazePose landmarks.
Dynamically calibrates biomechanical standards for ANY human body structure
(fat, short, tall, long-limbed, broad-built, limited mobility).
"""

from __future__ import annotations

import math
from typing import Any, Dict, List
from sports.common import LM, compute_angle, lm_to_point, Point, side_indices


def calculate_universal_human_profile(landmarks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze 33 BlazePose landmarks to determine individual somatotype and lever ratios.

    Parameters
    ----------
    landmarks : List of 33 landmark dicts.

    Returns
    -------
    Dict containing somatotype classification, stance width ratio, leverage class,
    and adaptive biomechanical recommendations.
    """
    l_shoulder = lm_to_point(landmarks[LM.LEFT_SHOULDER])
    r_shoulder = lm_to_point(landmarks[LM.RIGHT_SHOULDER])
    l_hip = lm_to_point(landmarks[LM.LEFT_HIP])
    r_hip = lm_to_point(landmarks[LM.RIGHT_HIP])
    l_knee = lm_to_point(landmarks[LM.LEFT_KNEE])
    r_knee = lm_to_point(landmarks[LM.RIGHT_KNEE])
    l_ankle = lm_to_point(landmarks[LM.LEFT_ANKLE])
    r_ankle = lm_to_point(landmarks[LM.RIGHT_ANKLE])

    # Segment lengths
    shoulder_width = math.hypot(l_shoulder.x - r_shoulder.x, l_shoulder.y - r_shoulder.y)
    hip_width = math.hypot(l_hip.x - r_hip.x, l_hip.y - r_hip.y)
    stance_width = math.hypot(l_ankle.x - r_ankle.x, l_ankle.y - r_ankle.y)

    mid_shoulder = Point((l_shoulder.x + r_shoulder.x) / 2.0, (l_shoulder.y + r_shoulder.y) / 2.0)
    mid_hip = Point((l_hip.x + r_hip.x) / 2.0, (l_hip.y + r_hip.y) / 2.0)
    mid_knee = Point((l_knee.x + r_knee.x) / 2.0, (l_knee.y + r_knee.y) / 2.0)
    mid_ankle = Point((l_ankle.x + r_ankle.x) / 2.0, (l_ankle.y + r_ankle.y) / 2.0)

    torso_len = math.hypot(mid_shoulder.x - mid_hip.x, mid_shoulder.y - mid_hip.y)
    femur_len = math.hypot(mid_hip.x - mid_knee.x, mid_hip.y - mid_knee.y)
    tibia_len = math.hypot(mid_knee.x - mid_ankle.x, mid_knee.y - mid_ankle.y)
    total_height_estimate = torso_len + femur_len + tibia_len

    # Ratios
    torso_femur_ratio = round(torso_len / max(0.001, femur_len), 2)
    hip_shoulder_ratio = round(hip_width / max(0.001, shoulder_width), 2)
    stance_hip_ratio = round(stance_width / max(0.001, hip_width), 2)

    # 1. Somatotype & Build Classification
    if hip_shoulder_ratio > 0.95 or stance_hip_ratio > 1.4:
        somatotype = "Endomorph / Heavy Build"
        body_type_note = (
            "Higher body mass / broader waist build. Naturally adopts wider stance for abdominal clearance during setup."
        )
        stance_recommendation = "Wider stance & slight foot flare-out is optimal for hip mobility."
    elif total_height_estimate > 0.65 and hip_shoulder_ratio < 0.75:
        somatotype = "Ectomorph / Tall & Lean Build"
        body_type_note = (
            "Longer limb segments relative to torso. Setup requires higher hip position and knee angle adaptation."
        )
        stance_recommendation = "Conventional narrow stance with hip-width feet."
    else:
        somatotype = "Mesomorph / Athletic Build"
        body_type_note = "Balanced shoulder-to-hip ratio and standard leverage distribution."
        stance_recommendation = "Standard hip-to-shoulder width stance."

    # 2. Leverage Type (Limb Ratios)
    if torso_femur_ratio < 0.85:
        lever_type = "Long Femurs / Short Torso"
    elif torso_femur_ratio > 1.15:
        lever_type = "Short Femurs / Long Torso"
    else:
        lever_type = "Proportional Levers"

    return {
        "somatotype": somatotype,
        "body_type_note": body_type_note,
        "lever_type": lever_type,
        "torso_femur_ratio": torso_femur_ratio,
        "hip_shoulder_ratio": hip_shoulder_ratio,
        "stance_hip_ratio": stance_hip_ratio,
        "stance_recommendation": stance_recommendation,
        "v2_adaptive": True,
    }


def get_v2_universal_thresholds(
    sport: str,
    base_thresholds: Dict[str, tuple[float, float]],
    human_profile: Dict[str, Any],
) -> Dict[str, tuple[float, float]]:
    """Adapt biomechanical evaluation thresholds for ANY human body structure (v2.0 Engine).

    Parameters
    ----------
    sport : "deadlift" or "bowling".
    base_thresholds : Baseline database threshold dict.
    human_profile : Result of calculate_universal_human_profile().

    Returns
    -------
    Dict of personalized reference ranges adapted to the athlete's body type.
    """
    adapted = dict(base_thresholds)
    somatotype = human_profile.get("somatotype", "")
    tf_ratio = human_profile.get("torso_femur_ratio", 1.0)

    if sport.lower() == "deadlift":
        # 1. Heavy / Endomorph Build Adaptation
        if "Endomorph" in somatotype or "Heavy" in somatotype:
            # Heavy lifters set up with wider stance & slightly lower hip angle for belly clearance
            # Hip lockout tolerance: 130° - 180°
            h_lo, h_hi = adapted.get("hip_lockout_angle", (140, 180))
            adapted["hip_lockout_angle"] = (max(130.0, h_lo - 10.0), h_hi)

            # Knee lockout tolerance: 135° - 180°
            k_lo, k_hi = adapted.get("knee_lockout_angle", (145, 180))
            adapted["knee_lockout_angle"] = (max(135.0, k_lo - 10.0), k_hi)

            # Rise sync ratio: 0.55 - 3.00
            adapted["hip_shoulder_rise_ratio"] = (0.55, 3.00)

        # 2. Long Femurs / Tall Lifter Adaptation
        elif tf_ratio < 0.85:
            # Long femurs mean hips sit higher naturally at setup
            h_lo, h_hi = adapted.get("hip_lockout_angle", (140, 180))
            adapted["hip_lockout_angle"] = (max(135.0, h_lo - 5.0), h_hi)
            adapted["hip_shoulder_rise_ratio"] = (0.60, 3.00)

        # 3. Short Femurs / Compact Lifter Adaptation
        elif tf_ratio > 1.15:
            adapted["hip_shoulder_rise_ratio"] = (0.65, 3.00)

    elif sport.lower() == "bowling":
        if "Endomorph" in somatotype:
            # Allow wider knee brace angle tolerance for heavier fast bowlers
            adapted["front_knee_angle"] = (125, 180)
            adapted["elbow_extension"] = (0, 30)

    return adapted
