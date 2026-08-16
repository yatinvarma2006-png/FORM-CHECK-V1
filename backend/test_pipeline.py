"""Integration test for FormCheck backend logic."""

from sports.common import LM

from sports.bowling import analyze_bowling
from sports.deadlift import analyze_deadlift


def create_dummy_landmarks() -> list[dict]:
    """Create 33 dummy landmarks with default positions."""
    landmarks = []
    for i in range(33):
        landmarks.append({
            "x": 0.5,
            "y": 0.5,
            "z": 0.0,
            "visibility": 0.9,
        })
    return landmarks


def test_bowling_analysis():
    lm_horiz = create_dummy_landmarks()
    lm_release = create_dummy_landmarks()

    # Set arm horizontal: shoulder (0.5, 0.3), elbow (0.7, 0.3), wrist (0.9, 0.3) -> 180 degrees
    lm_horiz[LM.RIGHT_SHOULDER] = {"x": 0.5, "y": 0.3, "z": 0, "visibility": 0.9}
    lm_horiz[LM.RIGHT_ELBOW] = {"x": 0.7, "y": 0.3, "z": 0, "visibility": 0.9}
    lm_horiz[LM.RIGHT_WRIST] = {"x": 0.9, "y": 0.3, "z": 0, "visibility": 0.9}

    # Set release: arm straight -> 180 degrees -> extension = 0 degrees
    lm_release[LM.RIGHT_SHOULDER] = {"x": 0.5, "y": 0.3, "z": 0, "visibility": 0.9}
    lm_release[LM.RIGHT_ELBOW] = {"x": 0.7, "y": 0.3, "z": 0, "visibility": 0.9}
    lm_release[LM.RIGHT_WRIST] = {"x": 0.9, "y": 0.3, "z": 0, "visibility": 0.9}

    # Front leg: hip (0.5, 0.5), knee (0.5, 0.7), ankle (0.5, 0.9) -> 180 degrees
    lm_release[LM.LEFT_HIP] = {"x": 0.5, "y": 0.5, "z": 0, "visibility": 0.9}
    lm_release[LM.LEFT_KNEE] = {"x": 0.5, "y": 0.7, "z": 0, "visibility": 0.9}
    lm_release[LM.LEFT_ANKLE] = {"x": 0.5, "y": 0.9, "z": 0, "visibility": 0.9}

    # Shoulders and Hips
    lm_release[LM.LEFT_SHOULDER] = {"x": 0.4, "y": 0.3, "z": 0, "visibility": 0.9}
    lm_release[LM.RIGHT_SHOULDER] = {"x": 0.6, "y": 0.3, "z": 0, "visibility": 0.9}
    lm_release[LM.LEFT_HIP] = {"x": 0.4, "y": 0.5, "z": 0, "visibility": 0.9}
    lm_release[LM.RIGHT_HIP] = {"x": 0.6, "y": 0.5, "z": 0, "visibility": 0.9}

    thresholds = {
        "elbow_extension": (0.0, 15.0),
        "front_knee_angle": (155.0, 180.0),
        "shoulder_hip_separation": (20.0, 45.0),
    }

    rules = {
        "elbow_extension": {"fault_name": "Test Fault", "injury_note": "Test Note", "fix_tip": "Test Tip"},
        "front_knee_angle": {"fault_name": "Test Fault 2", "injury_note": "Test Note 2", "fix_tip": "Test Tip 2"},
        "shoulder_hip_separation": {"fault_name": "Test Fault 3", "injury_note": "Test Note 3", "fix_tip": "Test Tip 3"},
    }

    results = analyze_bowling(lm_horiz, lm_release, "right", "left", thresholds, rules)
    assert len(results) == 3
    print("✓ Bowling analysis test passed successfully.")


def test_deadlift_analysis():
    lm_setup = create_dummy_landmarks()
    lm_early = create_dummy_landmarks()
    lm_lockout = create_dummy_landmarks()

    thresholds = {
        "hip_shoulder_rise_ratio": (0.8, 1.2),
        "hip_lockout_angle": (165.0, 180.0),
        "knee_lockout_angle": (170.0, 180.0),
    }

    rules = {
        "hip_shoulder_rise_ratio": {"fault_name": "Fault 1", "injury_note": "Note 1", "fix_tip": "Tip 1"},
        "hip_lockout_angle": {"fault_name": "Fault 2", "injury_note": "Note 2", "fix_tip": "Tip 2"},
        "knee_lockout_angle": {"fault_name": "Fault 3", "injury_note": "Note 3", "fix_tip": "Tip 3"},
    }

    results = analyze_deadlift(lm_setup, lm_early, lm_lockout, thresholds, rules)
    assert len(results) == 3
    print("✓ Deadlift 3-frame analysis test passed successfully.")

    # 2-frame deadlift (setup + lockout only)
    results_2frame = analyze_deadlift(lm_setup, None, lm_lockout, thresholds, rules)
    assert len(results_2frame) == 2
    print("✓ Deadlift 2-frame analysis test passed successfully.")


if __name__ == "__main__":
    test_bowling_analysis()
    test_deadlift_analysis()
