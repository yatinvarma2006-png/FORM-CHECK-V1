-- FormCheck MySQL Schema
-- Run this against your MySQL server to create the database and tables.

CREATE DATABASE IF NOT EXISTS formcheck
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE formcheck;

-- Reference thresholds: acceptable range for each metric per sport
CREATE TABLE IF NOT EXISTS reference_thresholds (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    sport       VARCHAR(50)  NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    min_value   DOUBLE       NOT NULL,
    max_value   DOUBLE       NOT NULL,
    unit        VARCHAR(20)  NOT NULL DEFAULT 'degrees',
    INDEX idx_sport (sport)
) ENGINE=InnoDB;

-- Fault rules: what to tell the user when a metric is out of range
CREATE TABLE IF NOT EXISTS fault_rules (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    sport       VARCHAR(50)  NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    fault_name  VARCHAR(200) NOT NULL,
    injury_note TEXT         NOT NULL,
    fix_tip     TEXT         NOT NULL,
    INDEX idx_sport (sport)
) ENGINE=InnoDB;

-- Submission history
CREATE TABLE IF NOT EXISTS submissions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    session_id   VARCHAR(64)  NOT NULL,
    sport        VARCHAR(50)  NOT NULL,
    metrics_json TEXT         NOT NULL,
    flags_json   TEXT         NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- ============================================================
-- Seed data: Bowling thresholds
-- ============================================================

INSERT INTO reference_thresholds (sport, metric_name, min_value, max_value, unit) VALUES
('bowling', 'elbow_extension',          0,   15, 'degrees'),
('bowling', 'front_knee_angle',       155,  180, 'degrees'),
('bowling', 'shoulder_hip_separation',  20,  45, 'degrees');

INSERT INTO fault_rules (sport, metric_name, fault_name, injury_note, fix_tip) VALUES
('bowling', 'elbow_extension',
 'Possible illegal / mixed bowling action',
 'This is the biomechanical marker used to assess bowling-action legality; mixed actions are associated with increased lower-back stress.',
 'Film side-on repeatedly and check the arm does not straighten further between the horizontal and release positions.'),
('bowling', 'front_knee_angle',
 'Collapsing front leg',
 'Reduces braking-force transfer, loads the knee and lower back.',
 'Strengthen quads; drill front-leg bracing without a ball.'),
('bowling', 'shoulder_hip_separation',
 'Low hip-shoulder separation',
 'Associated with a more front-on, higher-torque action and greater rotational spinal stress.',
 'Hip-lead drills — let the hips open before the shoulders rotate.');

-- ============================================================
-- Seed data: Deadlift thresholds
-- ============================================================

INSERT INTO reference_thresholds (sport, metric_name, min_value, max_value, unit) VALUES
('deadlift', 'hip_shoulder_rise_ratio', 0.8, 1.2, 'ratio'),
('deadlift', 'hip_lockout_angle',      165, 180, 'degrees'),
('deadlift', 'knee_lockout_angle',     170, 180, 'degrees');

INSERT INTO fault_rules (sport, metric_name, fault_name, injury_note, fix_tip) VALUES
('deadlift', 'hip_shoulder_rise_ratio',
 'Hips shooting up early / back rounding risk',
 'Shifts load onto the lower back instead of the legs.',
 'Cue "chest and hips rise together"; drill Romanian deadlifts to reinforce the hinge pattern.'),
('deadlift', 'hip_lockout_angle',
 'Incomplete lockout',
 'Leaves the lift unfinished — load stays partially on the lower back instead of the glutes/hamstrings.',
 'Cue full hip extension at the top; do not stop the rep at the knee.'),
('deadlift', 'knee_lockout_angle',
 'Knees not fully extended at lockout',
 'Incomplete lift — same load-transfer issue as above.',
 'Same as above — check the rep is being finished.');
