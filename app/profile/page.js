"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Footer from "@/components/Footer";
import {
  User, Mail, Calendar, Shield, CheckCircle2, AlertCircle,
  Key, Eye, EyeOff, Trash2, ExternalLink, Loader2,
  LogOut, Pencil, BookOpen, FolderOpen, Video, Save,
  ChevronRight, Sparkles, Lock
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // API Key state
  const [hasApiKey, setHasApiKey] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState("idle"); // idle | saving | deleting | success | error
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchAll();
    }
  }, [status, router]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchApiKeyStatus(), fetchStats()]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) setUserData(await res.json());
    } catch (e) { console.error("Error fetching profile:", e); }
  };

  const fetchApiKeyStatus = async () => {
    try {
      const res = await fetch("/api/user/api-key");
      if (res.ok) {
        const data = await res.json();
        setHasApiKey(data.hasKey);
      } else {
        setHasApiKey(false);
      }
    } catch { setHasApiKey(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.stats);
      }
    } catch (e) { console.error("Error fetching stats:", e); }
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setKeyStatus("saving");
    setKeyError("");
    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKeyStatus("error");
        setKeyError(data.error || "Failed to save");
        return;
      }
      setKeyStatus("success");
      setHasApiKey(true);
      setApiKeyInput("");
      setTimeout(() => setKeyStatus("idle"), 2000);
    } catch {
      setKeyStatus("error");
      setKeyError("Network error");
    }
  };

  const handleDeleteKey = async () => {
    setKeyStatus("deleting");
    setKeyError("");
    try {
      const res = await fetch("/api/user/api-key", { method: "DELETE" });
      if (res.ok) {
        setHasApiKey(false);
        setKeyStatus("idle");
      } else {
        setKeyStatus("error");
        setKeyError("Failed to remove key");
      }
    } catch {
      setKeyStatus("error");
      setKeyError("Network error");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const memberSince = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const accountType = userData?.authProvider === "google" ? "Google" : "Email";

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl pt-24">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account, API keys, and preferences
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-xs h-8">
            Back to Dashboard
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-emerald-500/20 via-blue-500/10 to-violet-500/20" />
          <CardContent className="relative pt-0 -mt-10 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={session.user?.image} alt={session.user?.name} />
                <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                  {getInitials(session.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-xl font-bold truncate">{session.user?.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {session.user?.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-500 h-8 text-xs"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill icon={FolderOpen} label="Workflows" value={stats.totalWorkflows} color="emerald" />
            <StatPill icon={BookOpen} label="Words" value={formatNumber(stats.totalWords)} color="blue" />
            <StatPill icon={Save} label="Versions" value={stats.totalVersions} color="violet" />
            <StatPill icon={Video} label="Videos" value={stats.totalVideos} color="pink" />
          </div>
        )}

        {/* Account Details */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Full Name" value={session.user?.name || "N/A"} />
              <InfoRow icon={Mail} label="Email" value={session.user?.email || "N/A"} />
              <InfoRow icon={Shield} label="Auth Method" value={accountType} badge />
              <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" /> Gemini API Key
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Your key is encrypted with AES-256-GCM and stored securely
                </CardDescription>
              </div>
              {hasApiKey && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasApiKey ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Lock className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">API key is active</p>
                    <p className="text-xs text-muted-foreground">
                      Your key is encrypted and ready for AI operations
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={handleDeleteKey}
                    disabled={keyStatus === "deleting"}
                  >
                    {keyStatus === "deleting" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <><Trash2 className="h-3.5 w-3.5 mr-1" /> Remove</>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  To update your key, remove the current one and add a new key.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">No API key configured</p>
                    <p className="text-xs text-muted-foreground">
                      Add your Gemini API key to enable AI-powered features
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-xs">Google Gemini API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="api-key"
                        type={showKey ? "text" : "password"}
                        placeholder="AIzaSy..."
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="pr-10 font-mono text-sm h-9"
                        onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4"
                      onClick={handleSaveKey}
                      disabled={!apiKeyInput.trim() || keyStatus === "saving"}
                    >
                      {keyStatus === "saving" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : keyStatus === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                  {keyError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {keyError}
                    </p>
                  )}
                </div>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Get a free API key from Google AI Studio
                </a>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SecurityRow
              label="Authentication"
              value={accountType === "Google" ? "Google OAuth 2.0" : "Email + Password (bcrypt)"}
              status="active"
            />
            <Separator className="opacity-50" />
            <SecurityRow
              label="API Key Encryption"
              value="AES-256-GCM with unique IV"
              status={hasApiKey ? "active" : "inactive"}
            />
            <Separator className="opacity-50" />
            <SecurityRow
              label="Session"
              value="JWT with HttpOnly cookies"
              status="active"
            />
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink
            icon={Sparkles}
            title="Create New Workflow"
            desc="Start an AI-powered script project"
            onClick={() => router.push("/workflows/create")}
          />
          <QuickLink
            icon={FolderOpen}
            title="My Workflows"
            desc="Browse and manage all your projects"
            onClick={() => router.push("/workflows")}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ─── Sub-Components ─── */

function StatPill({ icon: Icon, label, value, color }) {
  const colorMap = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-500" },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${c.text}`} />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value, badge }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {badge ? (
          <Badge variant="outline" className="text-xs mt-0.5 font-normal">{value}</Badge>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

function SecurityRow({ label, value, status }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      <Badge
        variant="outline"
        className={
          status === "active"
            ? "text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            : "text-[10px] bg-muted/50 text-muted-foreground border-border/40"
        }
      >
        {status === "active" ? "Active" : "—"}
      </Badge>
    </div>
  );
}

function QuickLink({ icon: Icon, title, desc, onClick }) {
  return (
    <Card
      onClick={onClick}
      className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium group-hover:text-emerald-500 transition-colors">{title}</p>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  );
}

/* ─── Utility ─── */

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
