/**
 * Custom React hooks for localStorage persistence
 */

import { useState, useEffect } from "react";
import { WorkflowState } from "./types";

const STORAGE_KEY = "pdf-to-anki-workflow";

export function useWorkflowState(initialState: WorkflowState) {
  const [state, setState] = useState<WorkflowState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setState(JSON.parse(stored));
        }
        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Error loading workflow state from localStorage:", error);
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Error saving workflow state to localStorage:", error);
      }
    }
  }, [state, isLoaded]);

  return [state, setState, isLoaded] as const;
}

export function clearWorkflowState() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing workflow state:", error);
    }
  }
}
