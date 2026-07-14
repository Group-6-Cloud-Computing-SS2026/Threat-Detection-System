import { useState } from "react";
import type { AuthMode } from "../types";

export function useAuthMode(initialMode: AuthMode) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  function switchMode(next: AuthMode) {
    setMode(next);
  }

  return { mode, switchMode };
}
