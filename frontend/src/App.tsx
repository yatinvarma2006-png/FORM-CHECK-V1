import { useState } from "react";
import DisclaimerBanner from "./components/DisclaimerBanner";
import SportSelector from "./components/SportSelector";
import VideoUploader from "./components/VideoUploader";
import VideoScrubber from "./components/VideoScrubber";
import SideConfig from "./components/SideConfig";
import SkeletonOverlay from "./components/SkeletonOverlay";
import ResultsPanel from "./components/ResultsPanel";
import HistoryPanel from "./components/HistoryPanel";

import { api } from "./api/client";
import type { Sport, VideoMeta, CapturedFrame, MetricResult, FrameRole, AICoachingReport, Anthropometrics, AIVisionAnalysis } from "./types";
import { FRAME_ROLES } from "./types";

export default function App() {
  const [sport, setSport] = useState<Sport | null>(null);
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<Record<string, CapturedFrame>>({});
  
  // Bowling config
  const [armSide, setArmSide] = useState("right");
  const [legSide, setLegSide] = useState("left");

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [metricsResult, setMetricsResult] = useState<MetricResult[] | null>(null);
  const [aiReport, setAiReport] = useState<AICoachingReport | null>(null);
  const [anthropometrics, setAnthropometrics] = useState<Anthropometrics | null>(null);
  const [aiVision, setAiVision] = useState<AIVisionAnalysis | null>(null);

  // Active view tab (Analyzer vs History)
  const [activeTab, setActiveTab] = useState<"analyzer" | "history">("analyzer");

  const resetAll = () => {
    setSport(null);
    setVideo(null);
    setCapturedFrames({});
    setMetricsResult(null);
    setAiReport(null);
    setAnthropometrics(null);
    setAiVision(null);
    setAnalysisError(null);
  };

  const handleFrameCaptured = (frame: CapturedFrame) => {
    setCapturedFrames((prev) => ({
      ...prev,
      [frame.role]: frame,
    }));
  };

  const requiredRoles = sport ? FRAME_ROLES[sport].filter((r) => !r.optional).map((r) => r.role) : [];
  const allRolesCaptured = requiredRoles.length > 0 && requiredRoles.every((r) => r in capturedFrames);

  const runAnalysis = async () => {
    if (!sport || !allRolesCaptured) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const framesPayload = Object.keys(capturedFrames).map((role) => {
        const f = capturedFrames[role];
        return {
          role,
          landmarks: f.landmarks || [],
        };
      });

      const res = await api.analyze({
        sport,
        frames: framesPayload,
        arm_side: armSide,
        leg_side: legSide,
      });

      setMetricsResult(res.metrics as MetricResult[]);
      if (res.ai_report) setAiReport(res.ai_report as AICoachingReport);
      if (res.anthropometrics) setAnthropometrics(res.anthropometrics as Anthropometrics);
      if (res.ai_vision) setAiVision(res.ai_vision as AIVisionAnalysis);
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const runAutoScan = async () => {
    if (!sport || !video) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await api.autoScan({
        video_id: video.video_id,
        sport,
        arm_side: armSide,
        leg_side: legSide,
      });

      const newCaptured: Record<string, CapturedFrame> = {};
      for (const df of res.detected_frames) {
        newCaptured[df.role] = {
          role: df.role as FrameRole,
          timestampSeconds: df.timestamp,
          frameBase64: df.frame_base64,
          annotatedBase64: df.annotated_base64,
          landmarks: df.landmarks as any,
        };
      }
      setCapturedFrames(newCaptured);
      setMetricsResult(res.metrics as MetricResult[]);
      if (res.ai_report) setAiReport(res.ai_report as AICoachingReport);
      if (res.anthropometrics) setAnthropometrics(res.anthropometrics as Anthropometrics);
      if (res.ai_vision) setAiVision(res.ai_vision as AIVisionAnalysis);
    } catch (err: any) {
      setAnalysisError(err.message || "Auto-scan failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-gray-100 flex flex-col">
      {/* Required Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Header */}
      <header className="border-b border-white/10 bg-surface-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetAll}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
              FC
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">FormCheck</h1>
              <p className="text-[10px] text-brand-400 tracking-wider font-semibold uppercase">
                Biomechanical Form & Injury Risk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("analyzer")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === "analyzer"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Analyzer
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === "history"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {activeTab === "history" ? (
          <div className="max-w-2xl mx-auto">
            <HistoryPanel />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step Wizard Header */}
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-400">
              <span className={`flex items-center gap-2 ${sport ? "text-emerald-400" : "text-brand-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${sport ? "bg-emerald-500 text-black font-bold" : "bg-brand-500 text-white"}`}>1</span>
                Sport
              </span>
              <div className="w-8 h-px bg-white/10" />
              <span className={`flex items-center gap-2 ${video ? "text-emerald-400" : sport ? "text-brand-400" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${video ? "bg-emerald-500 text-black font-bold" : sport ? "bg-brand-500 text-white" : "bg-gray-800"}`}>2</span>
                Video Upload
              </span>
              <div className="w-8 h-px bg-white/10" />
              <span className={`flex items-center gap-2 ${allRolesCaptured ? "text-emerald-400" : video ? "text-brand-400" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${allRolesCaptured ? "bg-emerald-500 text-black font-bold" : video ? "bg-brand-500 text-white" : "bg-gray-800"}`}>3</span>
                Frame Analysis
              </span>
              <div className="w-8 h-px bg-white/10" />
              <span className={`flex items-center gap-2 ${metricsResult ? "text-emerald-400" : allRolesCaptured ? "text-brand-400" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${metricsResult ? "bg-emerald-500 text-black font-bold" : allRolesCaptured ? "bg-brand-500 text-white" : "bg-gray-800"}`}>4</span>
                Results
              </span>
            </div>

            {/* Step 1: Select Sport */}
            {!sport && (
              <SportSelector onSelect={(selected) => setSport(selected)} />
            )}

            {/* Step 2: Upload Video */}
            {sport && !video && (
              <div>
                <div className="flex justify-between items-center max-w-2xl mx-auto mb-4">
                  <button
                    onClick={() => setSport(null)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    ← Change Sport ({sport === "bowling" ? "Cricket Bowling" : "Deadlift"})
                  </button>
                </div>
                <VideoUploader onUploaded={(meta) => setVideo(meta)} />
              </div>
            )}

            {/* Step 3: Scrubber & Frame Capture */}
            {sport && video && !metricsResult && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setVideo(null)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    ← Upload Different Video
                  </button>
                  <span className="text-xs text-brand-400 font-medium">
                    Sport: {sport === "bowling" ? "Cricket Bowling" : "Deadlift"}
                  </span>
                </div>

                {/* Auto-Scan Banner */}
                <div className="glass-card p-6 border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-brand-900/20 to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-xl flex-shrink-0">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        Automatic Full Video Scan
                      </h3>
                      <p className="text-xs text-gray-300 mt-1">
                        Scan the entire video automatically to detect key rep phases and evaluate injury risks across all frames without manual scrubbing.
                      </p>
                    </div>
                  </div>
                  <button
                    id="auto-scan-btn"
                    onClick={runAutoScan}
                    disabled={analyzing}
                    className="btn-primary bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-sm py-2.5 px-6 whitespace-nowrap shadow-lg shadow-purple-500/25 flex-shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Scanning Entire Video…
                      </>
                    ) : (
                      <>
                        ⚡ Auto-Scan Whole Video
                      </>
                    )}
                  </button>
                </div>

                {sport === "bowling" && (
                  <SideConfig
                    armSide={armSide}
                    legSide={legSide}
                    onArmSideChange={setArmSide}
                    onLegSideChange={setLegSide}
                  />
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface-950 px-3 text-gray-500 font-medium">
                      Or Scrub & Capture Manually
                    </span>
                  </div>
                </div>

                <VideoScrubber
                  sport={sport}
                  video={video}
                  capturedFrames={capturedFrames}
                  onFrameCaptured={handleFrameCaptured}
                />

                {/* Run Manual Analysis Button */}
                <div className="text-center pt-4">
                  <button
                    id="run-analysis-btn"
                    onClick={runAnalysis}
                    disabled={!allRolesCaptured || analyzing}
                    className="btn-primary text-base px-8 py-3.5 shadow-xl disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing Form…
                      </>
                    ) : (
                      <>
                        Analyze Captured Frames
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </button>
                  {!allRolesCaptured && (
                    <p className="text-xs text-amber-400/80 mt-2">
                      Please capture all required frames ({requiredRoles.length - Object.keys(capturedFrames).length} remaining) to analyze manually.
                    </p>
                  )}
                  {analysisError && (
                    <p className="text-xs text-red-400 mt-2">{analysisError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Results Display */}
            {sport && video && metricsResult && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                  <button
                    onClick={resetAll}
                    className="btn-secondary text-xs"
                  >
                    ← Analyze Another Video
                  </button>
                </div>

                {/* Render captured frames with Skeleton Overlay */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(capturedFrames).map((role) => {
                    const frame = capturedFrames[role];
                    const label = FRAME_ROLES[sport].find((r) => r.role === role)?.label || role;
                    if (!frame) return null;
                    return (
                      <SkeletonOverlay
                        key={role}
                        frame={frame}
                        metrics={metricsResult}
                        title={label}
                      />
                    );
                  })}
                </div>

                {/* Results Panel */}
                <ResultsPanel
                  metrics={metricsResult}
                  sport={sport}
                  aiReport={aiReport || undefined}
                  anthropometrics={anthropometrics || undefined}
                  aiVision={aiVision || undefined}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
