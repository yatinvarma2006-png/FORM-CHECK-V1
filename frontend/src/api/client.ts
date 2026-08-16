/* API client for FormCheck backend. */

const BASE_URL = "http://localhost:8000/api";

function getSessionId(): string {
  let id = localStorage.getItem("formcheck_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("formcheck_session_id", id);
  }
  return id;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "x-session-id": getSessionId(),
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (let browser set boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  uploadVideo: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{
      video_id: string;
      filename: string;
      duration_seconds: number;
      fps: number;
      width: number;
      height: number;
    }>("/video/upload", { method: "POST", body: fd });
  },

  extractFrame: (videoId: string, timestampSeconds: number) =>
    request<{
      frame_base64: string;
      annotated_base64: string | null;
      landmarks: Array<{ x: number; y: number; z: number; visibility: number }> | null;
      timestamp_seconds: number;
      pose_detected: boolean;
    }>("/video/extract-frame", {
      method: "POST",
      body: JSON.stringify({
        video_id: videoId,
        timestamp_seconds: timestampSeconds,
      }),
    }),

  analyze: (body: {
    sport: string;
    frames: Array<{ role: string; landmarks: Array<Record<string, number>> }>;
    arm_side?: string;
    leg_side?: string;
  }) =>
    request<{
      submission_id: number;
      sport: string;
      metrics: Array<Record<string, unknown>>;
      total_metrics: number;
      total_flags: number;
    }>("/analysis/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  autoScan: (body: {
    video_id: string;
    sport: string;
    arm_side?: string;
    leg_side?: string;
  }) =>
    request<{
      submission_id: number;
      sport: string;
      auto_detected: boolean;
      detected_frames: Array<{
        role: string;
        label: string;
        timestamp: number;
        frame_base64: string;
        annotated_base64: string | null;
        landmarks: Array<Record<string, number>>;
      }>;
      metrics: Array<Record<string, unknown>>;
      total_metrics: number;
      total_flags: number;
    }>("/analysis/auto-scan", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getHistory: () =>
    request<
      Array<{
        id: number;
        sport: string;
        metrics: Array<Record<string, unknown>>;
        flags: string[];
        created_at: string;
      }>
    >("/analysis/history"),

  aiChat: (body: {
    message: string;
    history: Array<{ role: string; text: string }>;
    sport?: string | null;
    metrics_context?: Array<Record<string, unknown>> | null;
    ai_report_context?: Record<string, unknown> | null;
  }) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
