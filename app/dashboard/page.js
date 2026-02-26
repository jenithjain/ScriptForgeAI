"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar
} from "recharts";
import {
  ArrowDownRight, BookOpen, TrendingUp,
  Activity, Sparkles,
  PenTool, Network, Video,
  Loader2, RefreshCw, Clock, CheckCircle2, AlertCircle,
  FolderOpen, Save, Flame, BarChart3,
  ChevronRight
} from "lucide-react";

const COLORS = {
  light: {
    primary: "#10b981", secondary: "#3b82f6", tertiary: "#f59e0b",
    quaternary: "#8b5cf6", fifth: "#ec4899", sixth: "#ef4444",
    grid: "#f1f5f9", axis: "#94a3b8",
    tooltipBg: "#ffffff", tooltipBorder: "#e2e8f0",
  },
  dark: {
    primary: "#34d399", secondary: "#60a5fa", tertiary: "#fbbf24",
    quaternary: "#a78bfa", fifth: "#f472b6", sixth: "#f87171",
    grid: "#1e293b", axis: "#64748b",
    tooltipBg: "#0f172a", tooltipBorder: "#1e293b",
  }
};

const STATUS_MAP = {
  draft: { label: "Draft", color: "bg-slate-400", ring: "ring-slate-400/20" },
  active: { label: "Active", color: "bg-blue-500", ring: "ring-blue-500/20" },
  running: { label: "Running", color: "bg-amber-500", ring: "ring-amber-500/20" },
  completed: { label: "Done", color: "bg-emerald-500", ring: "ring-emerald-500/20" },
  partial: { label: "Partial", color: "bg-orange-500", ring: "ring-orange-500/20" },
  error: { label: "Error", color: "bg-red-500", ring: "ring-red-500/20" },
};

export default function Dashboard() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [colors, setColors] = useState(COLORS.light);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const update = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDark(dark);
      setColors(dark ? COLORS.dark : COLORS.light);
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        throw new Error("Failed to load dashboard");
      }
      const json = await res.json();
      if (json.success) setData(json);
      else throw new Error(json.error || "Unknown error");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "10px",
    fontSize: "13px",
    color: isDark ? "#e2e8f0" : "#1e293b",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchDashboard} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, workflowWordCounts, activityTimeline, creationTimeline, recentWorkflows } = data;

  // Derived metrics
  const completionRate = stats.totalWorkflows > 0
    ? Math.round((stats.statusCounts.completed / stats.totalWorkflows) * 100)
    : 0;
  const activeCount = stats.statusCounts.active + stats.statusCounts.running;
  const avgWords = stats.totalWorkflows > 0
    ? Math.round(stats.totalWords / stats.totalWorkflows)
    : 0;

  // Writing streak (consecutive days with saves)
  const sortedDays = activityTimeline.map(d => d.date).sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (sortedDays.length > 0) {
    const checkStart = sortedDays[0] === today || sortedDays[0] === yesterday;
    if (checkStart) {
      let prev = new Date(sortedDays[0]);
      for (const d of sortedDays) {
        const curr = new Date(d);
        const diff = (prev - curr) / 86400000;
        if (diff <= 1) { streak++; prev = curr; }
        else break;
      }
    }
  }

  // Radial chart for completion
  const radialData = [{ name: "Completed", value: completionRate, fill: colors.primary }];

  // Top scripts by word count
  const topScripts = workflowWordCounts
    .filter(w => w.wordCount > 0)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 5);
  const maxWords = topScripts.length > 0 ? topScripts[0].wordCount : 1;

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {data.user?.name ? `Welcome back, ${data.user.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here&apos;s an overview of your creative workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchDashboard} className="h-8 px-2.5">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white h-8"
              onClick={() => router.push("/workflows/create")}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard label="Workflows" value={stats.totalWorkflows} sub={`${activeCount} active`} icon={FolderOpen} accent="emerald" />
          <KPICard label="Total Words" value={formatNumber(stats.totalWords)} sub={`~${formatNumber(avgWords)} avg`} icon={BookOpen} accent="blue" />
          <KPICard label="Versions" value={stats.totalVersions} sub={`+${formatNumber(stats.totalLinesAdded)} lines`} icon={Save} accent="violet" />
          <KPICard label="Videos" value={stats.totalVideos} sub={`${stats.videoStatusCounts.completed} done`} icon={Video} accent="pink" />
          <KPICard label="Writing Streak" value={`${streak}d`} sub={streak > 0 ? "Keep it up!" : "Start writing!"} icon={Flame} accent="amber" />
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-12">

          {/* Activity Chart */}
          <Card className="lg:col-span-8 border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Writing Activity</CardTitle>
                  <CardDescription className="text-xs">Saves &amp; edits over the last 30 days</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  <Activity className="w-3 h-3 mr-1" />
                  30 days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activityTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={activityTimeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSaves" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradLines" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.secondary} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis
                      dataKey="date" stroke={colors.axis} style={{ fontSize: "10px" }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis stroke={colors.axis} style={{ fontSize: "10px" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })} />
                    <Area type="monotone" dataKey="saves" stroke={colors.primary} fill="url(#gradSaves)" strokeWidth={2} name="Saves" />
                    <Area type="monotone" dataKey="linesAdded" stroke={colors.secondary} fill="url(#gradLines)" strokeWidth={1.5} name="Lines Added" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={Activity} message="No activity yet" hint="Start saving script versions to see trends" height="h-[260px]" />
              )}
            </CardContent>
          </Card>

          {/* Completion Ring + Quick Stats */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center pb-4">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <RadialBarChart
                      cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
                      barSize={12} data={radialData} startAngle={90} endAngle={-270}
                    >
                      <RadialBar background={{ fill: isDark ? "#1e293b" : "#f1f5f9" }} dataKey="value" cornerRadius={6} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{completionRate}%</span>
                    <span className="text-[10px] text-muted-foreground">completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-5 space-y-3">
                <MiniStat label="Completed" value={`${stats.statusCounts.completed}/${stats.totalWorkflows}`} color="emerald" icon={CheckCircle2} />
                <Separator className="opacity-50" />
                <MiniStat label="Lines Added" value={`+${formatNumber(stats.totalLinesAdded)}`} color="blue" icon={TrendingUp} />
                <Separator className="opacity-50" />
                <MiniStat label="Lines Removed" value={`-${formatNumber(stats.totalLinesRemoved)}`} color="red" icon={ArrowDownRight} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid gap-4 lg:grid-cols-12">

          {/* Top Scripts */}
          <Card className="lg:col-span-4 border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Scripts</CardTitle>
              <CardDescription className="text-xs">Ranked by word count</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topScripts.length > 0 ? topScripts.map((script, i) => (
                <div key={script.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[65%]">
                      <span className="text-muted-foreground mr-1.5">#{i + 1}</span>
                      {script.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{formatNumber(script.wordCount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(script.wordCount / maxWords) * 100}%` }} />
                  </div>
                </div>
              )) : (
                <EmptyState icon={BookOpen} message="No scripts yet" hint="Write your first script" height="h-[200px]" />
              )}
            </CardContent>
          </Card>

          {/* Workflow Growth */}
          <Card className="lg:col-span-4 border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Workflow Growth</CardTitle>
              <CardDescription className="text-xs">New workflows per month</CardDescription>
            </CardHeader>
            <CardContent>
              {creationTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={creationTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="month" stroke={colors.axis} style={{ fontSize: "10px" }} axisLine={false} tickLine={false} />
                    <YAxis stroke={colors.axis} style={{ fontSize: "10px" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="workflows" fill={colors.quaternary} radius={[4, 4, 0, 0]} name="Workflows" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={BarChart3} message="No growth data" hint="Create workflows to track growth" height="h-[220px]" />
              )}
            </CardContent>
          </Card>

          {/* Video Summary */}
          <Card className="lg:col-span-4 border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Video Generation</CardTitle>
              <CardDescription className="text-xs">Cinematic teaser stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{stats.totalVideos}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{stats.videoStatusCounts.completed}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Completed</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{stats.videoStatusCounts.processing}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Processing</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.videoStatusCounts.failed}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Failed</p>
                </div>
              </div>
              {stats.totalVideos > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Success Rate</span>
                    <span className="font-medium text-foreground">
                      {Math.round((stats.videoStatusCounts.completed / stats.totalVideos) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(stats.videoStatusCounts.completed / stats.totalVideos) * 100}%` }} />
                  </div>
                </div>
              )}
              {stats.totalVideos === 0 && (
                <EmptyState icon={Video} message="No videos yet" hint="Use the Cinematic Teaser agent" height="h-[60px]" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Workflows */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Workflows</CardTitle>
                <CardDescription className="text-xs">Your latest projects</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => router.push("/workflows")}>
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentWorkflows.length > 0 ? (
              <div className="space-y-1">
                {recentWorkflows.map((wf) => {
                  const st = STATUS_MAP[wf.status] || STATUS_MAP.draft;
                  return (
                    <div
                      key={wf.id}
                      onClick={() => router.push(`/workflows/${wf.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/30 transition-all cursor-pointer group"
                    >
                      <div className={`w-2 h-2 rounded-full ${st.color} ring-4 ${st.ring} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-emerald-500 transition-colors">{wf.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {wf.nodeCount} agents{wf.description && ` · ${wf.description.substring(0, 60)}${wf.description.length > 60 ? "..." : ""}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">{st.label}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{timeAgo(wf.updatedAt)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-sm mb-1">No workflows yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first workflow to get started</p>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => router.push("/workflows/create")}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Create Workflow
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction icon={PenTool} title="New Workflow" desc="Start a new AI-powered script" color="emerald" onClick={() => router.push("/workflows/create")} />
          <QuickAction icon={Network} title="Story Graph" desc="Explore your story universe" color="violet" onClick={() => router.push("/story-graph")} />
          <QuickAction icon={FolderOpen} title="All Workflows" desc="Browse & manage your projects" color="blue" onClick={() => router.push("/workflows")} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ─── Helper Components ─── */

function KPICard({ label, value, sub, icon: Icon, accent }) {
  const colorMap = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
  };
  const c = colorMap[accent] || colorMap.emerald;
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className={`p-1.5 rounded-lg ${c.bg}`}>
            <Icon className={`h-3.5 w-3.5 ${c.text}`} />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color, icon: Icon }) {
  const colorMap = {
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    red: "text-red-500",
  };
  const c = colorMap[color] || "text-muted-foreground";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${c}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, color, onClick }) {
  const colorMap = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", hover: "group-hover:bg-emerald-500" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500", hover: "group-hover:bg-violet-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", hover: "group-hover:bg-blue-500" },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <Card onClick={onClick} className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer group">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.text} ${c.hover} group-hover:text-white transition-colors`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium group-hover:text-emerald-500 transition-colors">{title}</p>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, message, hint, height = "h-[200px]" }) {
  return (
    <div className={`flex flex-col items-center justify-center ${height} text-muted-foreground`}>
      <Icon className="w-8 h-8 opacity-20 mb-2" />
      <p className="text-sm">{message}</p>
      {hint && <p className="text-[10px] mt-0.5">{hint}</p>}
    </div>
  );
}

/* ─── Utilities ─── */

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
