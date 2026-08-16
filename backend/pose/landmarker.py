"""MediaPipe Pose Landmarker wrapper.

Downloads the heavy model on first use and provides a simple detect_pose()
function that returns the 33 BlazePose landmarks for a single image.
"""

from __future__ import annotations

import urllib.request
from pathlib import Path
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

from config import MODEL_PATH, MODEL_URL


def _ensure_model() -> Path:
    """Download the pose_landmarker_heavy.task model if it doesn't exist."""
    if not MODEL_PATH.exists():
        print(f"⏬ Downloading MediaPipe Pose Landmarker model to {MODEL_PATH} …")
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, str(MODEL_PATH))
        print("✓ Model downloaded.")
    return MODEL_PATH


# Lazy-initialised singleton
_landmarker: Optional[vision.PoseLandmarker] = None


def _get_landmarker() -> vision.PoseLandmarker:
    global _landmarker
    if _landmarker is None:
        model_path = _ensure_model()
        options = vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(
                model_asset_path=str(model_path),
                delegate=mp_python.BaseOptions.Delegate.CPU,
            ),
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        _landmarker = vision.PoseLandmarker.create_from_options(options)
    return _landmarker


def detect_pose(image_bgr: np.ndarray) -> list[dict] | None:
    """Run pose detection on a BGR OpenCV image.

    Returns a list of 33 landmark dicts [{x, y, z, visibility}, …]
    or None if no pose was detected.
    """
    landmarker = _get_landmarker()

    # Convert BGR → RGB for MediaPipe
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

    result = landmarker.detect(mp_image)

    if not result.pose_landmarks or len(result.pose_landmarks) == 0:
        return None

    landmarks = result.pose_landmarks[0]
    return [
        {
            "x": lm.x,
            "y": lm.y,
            "z": lm.z,
            "visibility": lm.visibility,
        }
        for lm in landmarks
    ]


def draw_skeleton(
    image_bgr: np.ndarray,
    landmarks: list[dict],
    joint_status: dict[int, str] | None = None,
    min_visibility: float = 0.5,
) -> np.ndarray:
    """Draw a skeleton overlay on the image.

    Parameters
    ----------
    image_bgr : BGR image (will be copied, not mutated).
    landmarks : list of 33 landmark dicts from detect_pose().
    joint_status : mapping from landmark index → "ok" | "flagged".
        Joints marked "ok" are drawn green, "flagged" are drawn red.
        Unlisted joints get a default white dot.
    min_visibility : minimum visibility to draw a landmark/connection.

    Returns
    -------
    Annotated BGR image.
    """
    if joint_status is None:
        joint_status = {}

    canvas = image_bgr.copy()
    h, w = canvas.shape[:2]

    def _visible(idx: int) -> bool:
        return landmarks[idx].get("visibility", 0) >= min_visibility

    def _pt(idx: int) -> tuple[int, int]:
        px = max(0, min(w - 1, int(landmarks[idx]["x"] * w)))
        py = max(0, min(h - 1, int(landmarks[idx]["y"] * h)))
        return (px, py)

    # BlazePose connections (subset relevant to body)
    connections = [
        (11, 13), (13, 15),  # left arm
        (12, 14), (14, 16),  # right arm
        (11, 12),            # shoulders
        (11, 23), (12, 24),  # torso
        (23, 24),            # hips
        (23, 25), (25, 27),  # left leg
        (24, 26), (26, 28),  # right leg
    ]

    # Draw connections (only if both endpoints visible)
    for i, j in connections:
        if not _visible(i) or not _visible(j):
            continue
        cv2.line(canvas, _pt(i), _pt(j), (200, 200, 200), 2, cv2.LINE_AA)

    # Draw joints
    for idx, lm in enumerate(landmarks):
        if idx < 11:
            continue
        if not _visible(idx):
            continue
        px, py = _pt(idx)
        if idx in joint_status:
            color = (0, 200, 0) if joint_status[idx] == "ok" else (0, 0, 255)
            radius = 8
        else:
            color = (255, 255, 255)
            radius = 4
        cv2.circle(canvas, (px, py), radius, color, -1, cv2.LINE_AA)
        cv2.circle(canvas, (px, py), radius, (0, 0, 0), 1, cv2.LINE_AA)

    return canvas

