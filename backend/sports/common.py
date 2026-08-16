"""Shared angle-math and landmark utilities for sport modules."""

from __future__ import annotations

import math
from typing import NamedTuple


# ---------------------------------------------------------------------------
# BlazePose 33-point landmark indices (relevant body landmarks)
# ---------------------------------------------------------------------------
class LM:
    """Landmark index constants."""

    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28


class Point(NamedTuple):
    x: float
    y: float


def lm_to_point(landmark: dict) -> Point:
    """Extract (x, y) from a landmark dict."""
    return Point(landmark["x"], landmark["y"])


def compute_angle(a: Point, b: Point, c: Point) -> float:
    """Compute the angle at point B formed by points A-B-C, in degrees.

    Uses atan2 for correct quadrant handling. Returns 0-180.
    """
    ba = Point(a.x - b.x, a.y - b.y)
    bc = Point(c.x - b.x, c.y - b.y)

    dot = ba.x * bc.x + ba.y * bc.y
    cross = ba.x * bc.y - ba.y * bc.x

    angle_rad = math.atan2(abs(cross), dot)
    return math.degrees(angle_rad)


def compute_line_angle(p1: Point, p2: Point) -> float:
    """Angle of the line from p1→p2 relative to horizontal, in degrees."""
    return math.degrees(math.atan2(p2.y - p1.y, p2.x - p1.x))


def angular_difference(angle1: float, angle2: float) -> float:
    """Absolute angular difference, accounting for wrap-around."""
    diff = abs(angle1 - angle2) % 360
    return diff if diff <= 180 else 360 - diff


def side_indices(side: str) -> dict[str, int]:
    """Return landmark indices for the given side ('left' or 'right').

    Returns a dict with keys: shoulder, elbow, wrist, hip, knee, ankle.
    """
    if side.lower() == "left":
        return {
            "shoulder": LM.LEFT_SHOULDER,
            "elbow": LM.LEFT_ELBOW,
            "wrist": LM.LEFT_WRIST,
            "hip": LM.LEFT_HIP,
            "knee": LM.LEFT_KNEE,
            "ankle": LM.LEFT_ANKLE,
        }
    else:
        return {
            "shoulder": LM.RIGHT_SHOULDER,
            "elbow": LM.RIGHT_ELBOW,
            "wrist": LM.RIGHT_WRIST,
            "hip": LM.RIGHT_HIP,
            "knee": LM.RIGHT_KNEE,
            "ankle": LM.RIGHT_ANKLE,
        }
