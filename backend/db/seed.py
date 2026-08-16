"""Seed the database with initial reference thresholds and fault rules.

Run once after creating the database:
    python -m db.seed
"""

from sqlalchemy.orm import Session
from db.database import engine, SessionLocal, Base
from models.schema import ReferenceThreshold, FaultRule


THRESHOLDS = [
    # Bowling — ICC & biomechanical standards
    ("bowling", "elbow_extension", 0, 15, "degrees"),
    ("bowling", "front_knee_angle", 155, 180, "degrees"),
    ("bowling", "shoulder_hip_separation", 20, 45, "degrees"),
    # Deadlift — Gold-standard displacement & lockout ranges
    ("deadlift", "hip_shoulder_rise_ratio", 0.50, 1.40, "ratio"),
    ("deadlift", "hip_lockout_angle", 160, 180, "degrees"),
    ("deadlift", "knee_lockout_angle", 165, 180, "degrees"),
]

FAULT_RULES = [
    # Bowling
    (
        "bowling",
        "elbow_extension",
        "Possible illegal / mixed bowling action",
        "This is the biomechanical marker used to assess bowling-action legality; "
        "mixed actions are associated with increased lower-back stress.",
        "Film side-on repeatedly and check the arm does not straighten further "
        "between the horizontal and release positions.",
    ),
    (
        "bowling",
        "front_knee_angle",
        "Collapsing front leg",
        "Reduces braking-force transfer, loads the knee and lower back.",
        "Strengthen quads; drill front-leg bracing without a ball.",
    ),
    (
        "bowling",
        "shoulder_hip_separation",
        "Low hip-shoulder separation",
        "Associated with a more front-on, higher-torque action and greater "
        "rotational spinal stress.",
        "Hip-lead drills — let the hips open before the shoulders rotate.",
    ),
    # Deadlift
    (
        "deadlift",
        "hip_shoulder_rise_ratio",
        "Hips shooting up early / back rounding risk",
        "Shifts load onto the lower back instead of the legs.",
        'Cue "chest and hips rise together"; drill Romanian deadlifts to '
        "reinforce the hinge pattern.",
    ),
    (
        "deadlift",
        "hip_lockout_angle",
        "Incomplete lockout",
        "Leaves the lift unfinished — load stays partially on the lower back "
        "instead of the glutes/hamstrings.",
        "Cue full hip extension at the top; do not stop the rep at the knee.",
    ),
    (
        "deadlift",
        "knee_lockout_angle",
        "Knees not fully extended at lockout",
        "Incomplete lift — same load-transfer issue as above.",
        "Same as above — check the rep is being finished.",
    ),
]


def seed(db: Session) -> None:
    """Insert seed data if tables are empty."""

    if db.query(ReferenceThreshold).count() == 0:
        for sport, name, lo, hi, unit in THRESHOLDS:
            db.add(
                ReferenceThreshold(
                    sport=sport,
                    metric_name=name,
                    min_value=lo,
                    max_value=hi,
                    unit=unit,
                )
            )
        db.commit()
        print(f"✓ Seeded {len(THRESHOLDS)} reference thresholds.")
    else:
        print("• Reference thresholds already present — skipping.")

    if db.query(FaultRule).count() == 0:
        for sport, name, fault, injury, fix in FAULT_RULES:
            db.add(
                FaultRule(
                    sport=sport,
                    metric_name=name,
                    fault_name=fault,
                    injury_note=injury,
                    fix_tip=fix,
                )
            )
        db.commit()
        print(f"✓ Seeded {len(FAULT_RULES)} fault rules.")
    else:
        print("• Fault rules already present — skipping.")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    print("Done.")
