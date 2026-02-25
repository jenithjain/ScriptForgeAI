"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * ApiKeyModal
 *
 * Prompts the user for their Gemini API key when one isn't stored yet.
 *
 * Props:
 *  - open: boolean          – controlled visibility
 *  - onOpenChange: (v) =>   – called when the dialog wants to toggle
 *  - onKeySaved: () =>      – called after a key is successfully saved
 */
export default function ApiKeyModal({ open, onOpenChange, onKeySaved }) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setApiKey("");
      setShowKey(false);
      setStatus("idle");
      setErrorMsg("");
    }
  }, [open]);

  const handleSave = useCallback(async () => {
    if (!apiKey.trim()) return;

    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Failed to save API key");
        return;
      }

      setStatus("success");
      // Brief delay so user sees the success state
      setTimeout(() => {
        onKeySaved?.();
        onOpenChange?.(false);
      }, 1200);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Network error – please try again");
    }
  }, [apiKey, onKeySaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Gemini API Key Required
          </DialogTitle>
          <DialogDescription>
            ScriptForge AI uses Google Gemini to power its agents. Enter your
            personal API key to get started. It will be encrypted and stored
            securely – you only need to do this once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">API Key</Label>
            <div className="relative">
              <Input
                id="gemini-api-key"
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "saving" || status === "success"}
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {status === "error" && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}

          {/* Success message */}
          {status === "success" && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              API key verified and saved!
            </p>
          )}

          {/* Help link */}
          <p className="text-xs text-muted-foreground">
            Don&apos;t have a key?{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Get one from Google AI Studio
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={status === "saving"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !apiKey.trim() || status === "saving" || status === "success"
            }
          >
            {status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : (
              "Verify & Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
