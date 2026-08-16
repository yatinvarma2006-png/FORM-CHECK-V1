/**
 * VideoUploader — drag-and-drop zone with progress indicator.
 */
import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { VideoMeta } from "../types";

interface Props {
  onUploaded: (meta: VideoMeta) => void;
}

export default function VideoUploader({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a video file.");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const meta = await api.uploadVideo(file);
        onUploaded(meta as VideoMeta);
      } catch (e: any) {
        setError(e.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Video</h2>
        <p className="text-gray-400 text-sm">
          Record from a side-on camera angle for best pose-detection accuracy.
        </p>
      </div>

      <label
        id="video-drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          glass-card flex flex-col items-center justify-center gap-4 p-12
          cursor-pointer transition-all duration-300
          ${dragging ? "border-brand-500/60 bg-brand-500/10 scale-[1.02]" : "hover:border-white/20"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {uploading ? (
          <>
            <div className="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-gray-300 font-medium">Uploading…</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-200 font-medium mb-1">
                Drag & drop your video here
              </p>
              <p className="text-gray-500 text-sm">or click to browse files</p>
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={onFileSelect}
              className="hidden"
              id="video-file-input"
            />
          </>
        )}
      </label>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
