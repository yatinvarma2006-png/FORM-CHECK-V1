/**
 * SkeletonOverlay — renders captured frame with SVG skeleton overlay.
 * Color-codes measured joints: green = ok, red = flagged.
 *
 * CRITICAL: Uses preserveAspectRatio="xMidYMid meet" on the SVG to match
 * the img's "object-contain" behavior. Both the image and SVG share
 * identical aspect-ratio scaling, so normalized (0-1) landmark coords
 * map pixel-accurately onto the visible image area.
 */
import { useRef, useState, useEffect } from "react";
import type { CapturedFrame, MetricResult } from "../types";

interface Props {
  frame: CapturedFrame;
  metrics: MetricResult[];
  title: string;
}

// BlazePose body connections (indices 11-28)
const CONNECTIONS: [number, number][] = [
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 12],           // shoulders
  [11, 23], [12, 24], // torso
  [23, 24],           // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

// Minimum visibility to draw a landmark
const MIN_VISIBILITY = 0.5;

export default function SkeletonOverlay({ frame, metrics, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgRect, setImgRect] = useState<{ ox: number; oy: number; iw: number; ih: number } | null>(null);

  // After the image loads, compute the actual rendered rect inside the container
  // to position the SVG overlay correctly (matching object-contain behavior).
  const computeRect = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;

    // Replicate object-contain: scale to fit, centered
    const scale = Math.min(containerW / naturalW, containerH / naturalH);
    const iw = naturalW * scale;
    const ih = naturalH * scale;
    const ox = (containerW - iw) / 2;
    const oy = (containerH - ih) / 2;

    setImgRect({ ox, oy, iw, ih });
  };

  useEffect(() => {
    computeRect();
    const container = containerRef.current;
    let observer: ResizeObserver | null = null;

    if (container && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => computeRect());
      observer.observe(container);
    }

    window.addEventListener("resize", computeRect);
    return () => {
      window.removeEventListener("resize", computeRect);
      if (observer && container) observer.unobserve(container);
    };
  }, [frame.frameBase64]);

  if (!frame.landmarks) return null;

  // Build a set of all joints involved in metrics, with their status
  const jointStatus: Record<number, "ok" | "flagged"> = {};
  for (const m of metrics) {
    for (const j of m.joints) {
      if (m.flagged) {
        jointStatus[j] = "flagged";
      } else if (!jointStatus[j]) {
        jointStatus[j] = "ok";
      }
    }
  }

  const landmarks = frame.landmarks;

  // Convert normalized landmark coord to pixel position in the container
  const toX = (nx: number) => imgRect ? imgRect.ox + nx * imgRect.iw : 0;
  const toY = (ny: number) => imgRect ? imgRect.oy + ny * imgRect.ih : 0;

  const containerW = containerRef.current?.clientWidth || 1;
  const containerH = containerRef.current?.clientHeight || 1;

  const isVisible = (idx: number) =>
    landmarks[idx] && (landmarks[idx].visibility ?? 1) >= MIN_VISIBILITY;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-3 border-b border-white/10">
        <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
      </div>
      <div ref={containerRef} className="relative bg-black" style={{ minHeight: 200 }}>
        {/* Base frame image */}
        <img
          ref={imgRef}
          src={`data:image/jpeg;base64,${frame.frameBase64}`}
          alt={title}
          className="w-full aspect-video object-contain"
          onLoad={computeRect}
        />

        {/* SVG overlay — absolute positioned, same size as container */}
        {imgRect && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={containerW}
            height={containerH}
            viewBox={`0 0 ${containerW} ${containerH}`}
            preserveAspectRatio="none"
          >
            {/* Connections */}
            {CONNECTIONS.map(([i, j]) => {
              if (!isVisible(i) || !isVisible(j)) return null;
              return (
                <line
                  key={`${i}-${j}`}
                  x1={toX(landmarks[i].x)}
                  y1={toY(landmarks[i].y)}
                  x2={toX(landmarks[j].x)}
                  y2={toY(landmarks[j].y)}
                  stroke="rgba(200,200,200,0.6)"
                  strokeWidth="2"
                />
              );
            })}

            {/* Joints */}
            {landmarks.map((lm, idx) => {
              if (idx < 11) return null; // skip face
              if (!isVisible(idx)) return null;
              const status = jointStatus[idx];
              const color =
                status === "flagged"
                  ? "#ef4444"
                  : status === "ok"
                  ? "#22c55e"
                  : "rgba(255,255,255,0.5)";
              const r = status ? 6 : 3;
              return (
                <circle
                  key={idx}
                  cx={toX(lm.x)}
                  cy={toY(lm.y)}
                  r={r}
                  fill={color}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
