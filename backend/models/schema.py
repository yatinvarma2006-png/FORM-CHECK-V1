"""SQLAlchemy ORM models for FormCheck."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from db.database import Base


class ReferenceThreshold(Base):
    """Stores the acceptable range for each metric per sport."""

    __tablename__ = "reference_thresholds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sport = Column(String(50), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    min_value = Column(Float, nullable=False)
    max_value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="degrees")

    def __repr__(self) -> str:
        return (
            f"<ReferenceThreshold {self.sport}/{self.metric_name} "
            f"[{self.min_value}-{self.max_value} {self.unit}]>"
        )


class FaultRule(Base):
    """Maps a flagged metric to its fault name, injury note, and fix tip."""

    __tablename__ = "fault_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sport = Column(String(50), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    fault_name = Column(String(200), nullable=False)
    injury_note = Column(Text, nullable=False)
    fix_tip = Column(Text, nullable=False)

    def __repr__(self) -> str:
        return f"<FaultRule {self.sport}/{self.metric_name}: {self.fault_name}>"


class Submission(Base):
    """Stores each analysis submission for history tracking."""

    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=False, index=True)
    sport = Column(String(50), nullable=False)
    metrics_json = Column(Text, nullable=False)
    flags_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Submission {self.id} [{self.sport}] @ {self.created_at}>"
