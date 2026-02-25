"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import ApiKeyModal from "@/components/ApiKeyModal";

const ApiKeyContext = createContext({
  hasKey: null,
  ensureKey: () => false,
  openModal: () => {},
});

export function useApiKeyContext() {
  return useContext(ApiKeyContext);
}

/**
 * ApiKeyProvider
 *
 * Wrap any authenticated area with this provider to enable the
 * API key prompt flow. It checks if the user already has a key
 * stored on mount, and exposes `ensureKey()` which other components
 * can call before triggering Gemini-powered actions.
 */
export default function ApiKeyProvider({ children }) {
  const [hasKey, setHasKey] = useState(null); // null = loading
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/api-key");
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.hasKey);
      } else {
        // If 401 or other error, assume no key
        setHasKey(false);
      }
    } catch {
      setHasKey(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Call before triggering any Gemini-powered action.
   * Returns true if key is present, false if modal was opened.
   */
  const ensureKey = useCallback(() => {
    // If there's a server env var, always allow (dev mode)
    // In production without env var, hasKey must be true
    if (hasKey === true) return true;
    setModalOpen(true);
    return false;
  }, [hasKey]);

  const handleKeySaved = useCallback(() => {
    setHasKey(true);
    setModalOpen(false);
  }, []);

  return (
    <ApiKeyContext.Provider value={{ hasKey, ensureKey, openModal: () => setModalOpen(true) }}>
      {children}
      <ApiKeyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onKeySaved={handleKeySaved}
      />
    </ApiKeyContext.Provider>
  );
}
