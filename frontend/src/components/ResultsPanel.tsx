/**
 * ResultsPanel — displays each metric with value, range, status,
 * and for flagged ones: fault name, injury note, fix tip.
 */
import type { MetricResult, AICoachingReport } from "../types";
import AICoachingCard from "./AICoachingCard";

interface Props {
  metrics: MetricResult[];
  sport: string;
  aiReport?: AICoachingReport;
}

export default function ResultsPanel({ metrics, sport, aiReport }: Props) {
  const flagged = metrics.filter((m) => m.flagged);
  const passed = metrics.filter((m) => !m.flagged);

  return (
    <div className="animate-slide-up space-y-6">
      {/* AI Coaching Card */}
      {aiReport && <AICoachingCard report={aiReport} sport={sport} metrics={metrics} />}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Analysis Results</h2>
        <p className="text-gray-400 text-sm">
          {sport === "bowling" ? "🏏 Cricket Bowling" : "🏋️ Deadlift"} •{" "}
          {flagged.length === 0 ? (
            <span className="text-emerald-400 font-medium">All metrics within range!</span>
          ) : (
            <span className="text-red-400 font-medium">
              {flagged.length} of {metrics.length} metrics flagged
            </span>
          )}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{metrics.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Metrics</p>
        </div>
        <div className="glass-card p-4 text-center border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400">{passed.length}</p>
          <p className="text-xs text-gray-400 mt-1">Passed</p>
        </div>
        <div className="glass-card p-4 text-center border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{flagged.length}</p>
          <p className="text-xs text-gray-400 mt-1">Flagged</p>
        </div>
      </div>

      {/* Metric details */}
      <div className="space-y-4">
        {metrics.map((m, i) => (
          <div
            key={m.metric_name}
            className={`metric-card ${m.flagged ? "flagged" : "ok"}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    m.flagged ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-emerald-500 shadow-lg shadow-emerald-500/50"
                  }`}
                />
                <h3 className="font-semibold text-white">{m.display_name}</h3>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  m.flagged
                    ? "bg-red-500/15 text-red-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {m.flagged ? "FLAGGED" : "OK"}
              </span>
            </div>

            {/* Value bar */}
            <div className="mb-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-white font-mono">
                  {m.value}
                </span>
                <span className="text-sm text-gray-400">{m.unit}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Target range:</span>
                <span className="font-mono text-gray-400">
                  {m.min}–{m.max} {m.unit}
                </span>
              </div>
              {/* Visual range bar */}
              <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden relative">
                {/* Target range indicator */}
                <div
                  className="absolute h-full bg-emerald-500/20 rounded-full"
                  style={{
                    left: `${Math.max(0, (m.min / (m.max * 1.5)) * 100)}%`,
                    width: `${Math.min(100, ((m.max - m.min) / (m.max * 1.5)) * 100)}%`,
                  }}
                />
                {/* Value indicator */}
                <div
                  className={`absolute h-full w-1.5 rounded-full -translate-x-1/2 ${
                    m.flagged ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{
                    left: `${Math.min(100, Math.max(0, (m.value / (m.max * 1.5)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Fault details (only for flagged) */}
            {m.flagged && m.fault_name && (
              <div className="mt-4 space-y-3 pt-4 border-t border-red-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400">{m.fault_name}</p>
                    <p className="text-sm text-gray-400 mt-1">{m.injury_note}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-300 uppercase tracking-wide mb-1">
                      How to Fix
                    </p>
                    <p className="text-sm text-gray-300">{m.fix_tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
