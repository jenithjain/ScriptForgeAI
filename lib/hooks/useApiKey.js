"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useApiKey – React hook to manage the Gemini API key prompt flow.
 *
 * Returns:
 *  - hasKey:       boolean | null  (null = still loading)
 *  - modalOpen:    boolean         (controls ApiKeyModal visibility)
 *  - setModalOpen: (v) => void
 *  - ensureKey:    () => boolean   (call before running a workflow;
 *                                   returns true if key is present,
 *                                   opens modal and returns false if not)
 *  - refresh:      () => void      (re-check from server)
 */
export function useApiKey() {
  const [hasKey, setHasKey] = useState(null); // null = loading
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/api-key");
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.hasKey);
      }
    } catch {
      // If the check fails, assume no key (modal will appear)
      setHasKey(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Call this before any Gemini-powered action.
   * Returns true if the user has a key; otherwise opens the modal and returns false.
   */
  const ensureKey = useCallback(() => {
    if (hasKey) return true;
    setModalOpen(true);
    return false;
  }, [hasKey]);

  /**
   * Re-fetch the key status (e.g. after the modal saves a key).
   */
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    hasKey,
    modalOpen,
    setModalOpen,
    ensureKey,
    refresh,
  };
}
