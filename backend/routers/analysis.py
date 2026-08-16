"""Analysis and history endpoints."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from models.schema import FaultRule, ReferenceThreshold, Submission
from pose.landmarker import draw_skeleton
from sports.bowling import analyze_bowling
from sports.deadlift import analyze_deadlift

import base64
import cv2
import numpy as np

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


# ── Request / Response models ───────────────────────────────────────────

class FrameData(BaseModel):
    role: str  # e.g. "arm_horizontal", "release", "setup", "early_pull", "lockout"
    landmarks: list[dict]


class AnalyzeRequest(BaseModel):
    sport: str  # "bowling" or "deadlift"
    frames: list[FrameData]
    arm_side: Optional[str] = None  # bowling only
    leg_side: Optional[str] = None  # bowling only


# ── Helpers ─────────────────────────────────────────────────────────────

def _load_thresholds(db: Session, sport: str) -> dict[str, tuple[float, float]]:
    rows = db.query(ReferenceThreshold).filter_by(sport=sport).all()
    return {r.metric_name: (r.min_value, r.max_value) for r in rows}


def _load_rules(db: Session, sport: str) -> dict[str, dict]:
    rows = db.query(FaultRule).filter_by(sport=sport).all()
    return {
        r.metric_name: {
            "fault_name": r.fault_name,
            "injury_note": r.injury_note,
            "fix_tip": r.fix_tip,
        }
        for r in rows
    }


def _frames_by_role(frames: list[FrameData]) -> dict[str, list[dict]]:
    return {f.role: f.landmarks for f in frames}


# ── Endpoints ───────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze(
    req: AnalyzeRequest,
    x_session_id: str = Header(default="anonymous"),
    db: Session = Depends(get_db),
):
    """Run rule-based form analysis on captured frames."""
    sport = req.sport.lower()
    if sport not in ("bowling", "deadlift"):
        raise HTTPException(status_code=400, detail="Sport must be 'bowling' or 'deadlift'.")

    thresholds = _load_thresholds(db, sport)
    rules = _load_rules(db, sport)
    frame_map = _frames_by_role(req.frames)

    # ── Universal Human Somatotype & AI Calibration v2.0 ──────────────────
    from sports.anthropometrics import calculate_anthropometrics
    from sports.somatotype import calculate_universal_human_profile, get_v2_universal_thresholds
    from sports.ai_vision import analyze_form_with_ai_vision

    ref_lms = list(frame_map.values())[0] if frame_map else []
    anthropometrics = calculate_anthropometrics(ref_lms) if ref_lms else {}
    somatotype_profile = calculate_universal_human_profile(ref_lms) if ref_lms else {}
    anthropometrics.update(somatotype_profile)

    # Adapt thresholds dynamically for this human subject's body structure (v2.0)
    human_thresholds = get_v2_universal_thresholds(sport, thresholds, anthropometrics)

    if sport == "bowling":
        if "arm_horizontal" not in frame_map or "release" not in frame_map:
            raise HTTPException(
                status_code=400,
                detail="Bowling requires frames with roles 'arm_horizontal' and 'release'.",
            )
        arm_side = (req.arm_side or "right").lower()
        leg_side = (req.leg_side or "left").lower()

        metrics = analyze_bowling(
            landmarks_arm_horizontal=frame_map["arm_horizontal"],
            landmarks_release=frame_map["release"],
            arm_side=arm_side,
            leg_side=leg_side,
            thresholds=human_thresholds,
            rules=rules,
        )
    else:  # deadlift
        if "setup" not in frame_map or "lockout" not in frame_map:
            raise HTTPException(
                status_code=400,
                detail="Deadlift requires at least 'setup' and 'lockout' frames.",
            )
        metrics = analyze_deadlift(
            landmarks_setup=frame_map["setup"],
            landmarks_early_pull=frame_map.get("early_pull"),
            landmarks_lockout=frame_map["lockout"],
            thresholds=human_thresholds,
            rules=rules,
        )

    # Build summary
    flags = [m for m in metrics if m["flagged"]]

    # Generate AI Coaching & Kinematic Insights
    from sports.ai_coach import generate_ai_coaching_report
    ai_report = generate_ai_coaching_report(sport=sport, metrics=metrics, total_flags=len(flags))

    # Perform Multimodal AI Vision Inspection
    ai_vision = analyze_form_with_ai_vision(
        sport=sport,
        frames=[{"role": k, "frame_base64": "", "annotated_base64": ""} for k in frame_map.keys()],
        anthropometrics=anthropometrics,
    )

    # Store submission
    submission = Submission(
        session_id=x_session_id,
        sport=sport,
        metrics_json=json.dumps(metrics),
        flags_json=json.dumps([m["metric_name"] for m in flags]),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return {
        "submission_id": submission.id,
        "sport": sport,
        "metrics": metrics,
        "total_metrics": len(metrics),
        "total_flags": len(flags),
        "ai_report": ai_report,
        "anthropometrics": anthropometrics,
        "ai_vision": ai_vision,
        "version": "v2.0-universal",
    }


class AutoScanRequest(BaseModel):
    video_id: str
    sport: str
    arm_side: Optional[str] = "right"
    leg_side: Optional[str] = "left"


@router.post("/auto-scan")
async def auto_scan(
    req: AutoScanRequest,
    x_session_id: str = Header(default="anonymous"),
    db: Session = Depends(get_db),
):
    """Scan the entire video file automatically, detect key rep phases, and compute metrics."""
    from sports.auto_detect import auto_analyze_video
    from sports.ai_coach import generate_ai_coaching_report

    sport = req.sport.lower()
    if sport not in ("bowling", "deadlift"):
        raise HTTPException(status_code=400, detail="Sport must be 'bowling' or 'deadlift'.")

    thresholds = _load_thresholds(db, sport)
    rules = _load_rules(db, sport)

    try:
        res = auto_analyze_video(
            video_id=req.video_id,
            sport=sport,
            arm_side=(req.arm_side or "right").lower(),
            leg_side=(req.leg_side or "left").lower(),
            thresholds=thresholds,
            rules=rules,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    flags = [m for m in res["metrics"] if m["flagged"]]
    ai_report = generate_ai_coaching_report(sport=sport, metrics=res["metrics"], total_flags=len(flags))
    res["ai_report"] = ai_report

    # Universal Human Somatotype & AI Calibration v2.0
    from sports.anthropometrics import calculate_anthropometrics
    from sports.somatotype import calculate_universal_human_profile
    from sports.ai_vision import analyze_form_with_ai_vision

    ref_lms = res["detected_frames"][0]["landmarks"] if res.get("detected_frames") else []
    anthro = calculate_anthropometrics(ref_lms) if ref_lms else {}
    if ref_lms:
        anthro.update(calculate_universal_human_profile(ref_lms))

    vision = analyze_form_with_ai_vision(sport, res.get("detected_frames", []), anthro)

    res["anthropometrics"] = anthro
    res["ai_vision"] = vision
    res["version"] = "v2.0-universal"

    # Store submission in history
    submission = Submission(
        session_id=x_session_id,
        sport=sport,
        metrics_json=json.dumps(res["metrics"]),
        flags_json=json.dumps([m["metric_name"] for m in flags]),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    res["submission_id"] = submission.id
    return res


@router.get("/history")
async def get_history(
    x_session_id: str = Header(default="anonymous"),
    db: Session = Depends(get_db),
):
    """Return past submissions for the given session."""
    rows = (
        db.query(Submission)
        .filter_by(session_id=x_session_id)
        .order_by(Submission.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "sport": r.sport,
            "metrics": json.loads(r.metrics_json),
            "flags": json.loads(r.flags_json),
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
