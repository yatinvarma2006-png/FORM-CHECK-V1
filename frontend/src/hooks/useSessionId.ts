import { useState, useEffect } from "react";

/**
 * Returns a stable session UUID stored in localStorage.
 * Creates one on first visit.
 */
export function useSessionId(): string {
  const [id] = useState<string>(() => {
    let stored = localStorage.getItem("formcheck_session_id");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("formcheck_session_id", stored);
    }
    return stored;
  });
  return id;
}
