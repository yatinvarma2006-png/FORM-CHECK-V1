/* FormCheck shared TypeScript types. */

export type Sport = "bowling" | "deadlift";

export type BowlingFrameRole = "arm_horizontal" | "release";
export type DeadliftFrameRole = "setup" | "early_pull" | "lockout";
export type FrameRole = BowlingFrameRole | DeadliftFrameRole;

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface CapturedFrame {
  role: FrameRole;
  timestampSeconds: number;
  frameBase64: string;
  annotatedBase64: string | null;
  landmarks: Landmark[] | null;
}

export interface MetricResult {
  metric_name: string;
  display_name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  flagged: boolean;
  joints: number[];
  fault_name?: string;
  injury_note?: string;
  fix_tip?: string;
}

export interface AICoachingReport {
  ai_score: number;
  risk_level: string;
  risk_color: string;
  summary: string;
  insights: Array<{
    category: string;
    title: string;
    detail: string;
  }>;
  cues: string[];
  recommended_drills: Array<{
    name: string;
    description: string;
  }>;
}

export interface AnalysisResult {
  submission_id: number;
  sport: Sport;
  metrics: MetricResult[];
  total_metrics: number;
  total_flags: number;
  ai_report?: AICoachingReport;
}

export interface SubmissionHistory {
  id: number;
  sport: Sport;
  metrics: MetricResult[];
  flags: string[];
  created_at: string;
}

export interface VideoMeta {
  video_id: string;
  filename: string;
  duration_seconds: number;
  fps: number;
  width: number;
  height: number;
}

export interface FrameExtractionResult {
  frame_base64: string;
  annotated_base64: string | null;
  landmarks: Landmark[] | null;
  timestamp_seconds: number;
  pose_detected: boolean;
}

export const FRAME_ROLES: Record<Sport, { role: FrameRole; label: string; optional?: boolean }[]> = {
  bowling: [
    { role: "arm_horizontal", label: "Arm Horizontal" },
    { role: "release", label: "Release" },
  ],
  deadlift: [
    { role: "setup", label: "Setup (bar on floor)" },
    { role: "lockout", label: "Lockout (standing)" },
    { role: "early_pull", label: "Early Pull (optional)", optional: true },
  ],
};
