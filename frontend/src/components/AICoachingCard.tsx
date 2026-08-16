/**
 * AICoachingCard — Premium AI Biomechanical Coach panel.
 *
 * Features:
 *   • Animated radial score gauge (SVG circle with CSS stroke animation)
 *   • Risk matrix badge (Low / Moderate / High)
 *   • Categorized biomechanical breakdown cards
 *   • Personal movement cues & tailored corrective drills
 *   • Built-in AI Chat Assistant to ask follow-up questions
 */
import { useState, useEffect, useRef } from "react";
import type { AICoachingReport } from "../types";

/* ─── Radial Gauge ──────────────────────────────────── */
function RadialGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const strokeColor =
    score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"
        />
        {/* Animated score ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white font-mono leading-none">
          {animatedScore}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-1">
          AI Score
        </span>
      </div>
    </div>
  );
}

/* ─── Risk Badge ────────────────────────────────────── */
function RiskBadge({ level, color }: { level: string; color: string }) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10",
    red: "bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10",
  };
  const icons: Record<string, string> = {
    emerald: "✓",
    amber: "⚠",
    red: "⛔",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-lg ${styles[color] || styles.amber}`}>
      <span>{icons[color] || "⚠"}</span>
      {level}
    </span>
  );
}

/* ─── AI Chat Assistant (powered by Gemini) ──────────── */
import { api } from "../api/client";
import type { MetricResult } from "../types";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

interface AIChatProps {
  report: AICoachingReport;
  sport?: string;
  metrics?: MetricResult[];
}

function AIChatAssistant({ report, sport, metrics }: AIChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || thinking) return;
    const userMsg: ChatMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setError(null);

    try {
      const res = await api.aiChat({
        message: userMsg.text,
        history: messages,
        sport: sport || null,
        metrics_context: (metrics as Array<Record<string, unknown>>) || null,
        ai_report_context: report as unknown as Record<string, unknown>,
      });

      const aiMsg: ChatMessage = { role: "ai", text: res.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg = err.message || "Failed to get AI response";
      if (errMsg.includes("GEMINI_API_KEY")) {
        setError("API key not configured. Set GEMINI_API_KEY env variable and restart the backend.");
      } else {
        setError(errMsg);
      }
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-brand-600/20 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm font-semibold text-white">Ask the AI Coach</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
            Interactive
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-purple-500/20 bg-surface-900/80 overflow-hidden animate-fade-in">
          {/* Chat messages */}
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-gray-400">
                  Ask about your form, injury risks, or recommended drills.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["What's my score?", "Am I at injury risk?", "What drills should I do?", "Give me a summary"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/25 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-600/30 text-brand-100 rounded-br-md"
                      : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-md"
                  }`}
                >
                  {msg.role === "ai" && (
                    <span className="text-purple-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                      🤖 AI Coach
                    </span>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[10px] text-gray-500 ml-2">Thinking with Gemini…</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-md">
                  ⚠️ {error}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your form analysis…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 transition-all"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────── */
interface Props {
  report: AICoachingReport;
  sport?: string;
  metrics?: MetricResult[];
}

export default function AICoachingCard({ report, sport, metrics }: Props) {
  return (
    <div className="glass-card p-6 border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-brand-950/20 to-surface-900/40 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-brand-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/25">
            🤖
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              AI Biomechanical Coach
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
                Smart Analysis
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Personalized movement efficiency • Injury risk matrix • Corrective drills
            </p>
          </div>
        </div>
        <RiskBadge level={report.risk_level} color={report.risk_color} />
      </div>

      {/* Score Gauge + Summary */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <RadialGauge score={report.ai_score} />
        <div className="flex-1 space-y-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-200 leading-relaxed font-medium">
              {report.summary}
            </p>
          </div>
          {/* Quick stats row */}
          <div className="flex gap-3">
            <div className="flex-1 text-center py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg font-bold text-white">{report.insights.length}</span>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Insights</span>
            </div>
            <div className="flex-1 text-center py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg font-bold text-white">{report.cues.length}</span>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Cues</span>
            </div>
            <div className="flex-1 text-center py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg font-bold text-white">{report.recommended_drills.length}</span>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Drills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Biomechanical Breakdown */}
      {report.insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔬</span> Biomechanical Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.insights.map((ins, i) => (
              <div
                key={i}
                className="glass-card p-4 border-white/10 hover:border-purple-500/30 transition-colors"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                    {ins.category}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-white mb-1.5">{ins.title}</h5>
                <p className="text-xs text-gray-400 leading-relaxed">{ins.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cues & Drills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Movement Cues */}
        {report.cues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span> AI Movement Cues
            </h4>
            <div className="space-y-2">
              {report.cues.map((cue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="text-brand-400 font-bold mt-0.5 text-sm">→</span>
                  <span className="leading-relaxed">{cue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corrective Drills */}
        {report.recommended_drills.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏋️</span> Recommended Drills
            </h4>
            <div className="space-y-2">
              {report.recommended_drills.map((drill, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-purple-500/30 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {drill.name}
                  </div>
                  <div className="text-gray-400 leading-relaxed pl-6">{drill.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Assistant — Powered by Gemini */}
      <AIChatAssistant report={report} sport={sport} metrics={metrics} />
    </div>
  );
}
