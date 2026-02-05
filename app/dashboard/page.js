"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import {
  ArrowUpRight, BookOpen, TrendingUp,
  Users, Activity, GitBranch, FileText, Sparkles,
  PenTool, Target, Network, Shield, Video,
  Loader2, RefreshCw, Clock, CheckCircle2, AlertCircle,
  FolderOpen, Save
} from "lucide-react";

const CHART_COLORS = {
  light: {
    primary: "#10b981",
    secondary: "#3b82f6",
    tertiary: "#f59e0b",
    quaternary: "#8b5cf6",
    fifth: "#ec4899",
    sixth: "#ef4444",
    grid: "#e2e8f0",
    axis: "#64748b",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
  },
  dark: {
    primary: "#34d399",
    secondary: "#60a5fa",
    tertiary: "#fbbf24",
    quaternary: "#a78bfa",
    fifth: "#f472b6",
    sixth: "#f87171",
    grid: "#334155",
    axis: "#94a3b8",
    tooltipBg: "#1e293b",
    tooltipBorder: "#334155",
  }
};

const STATUS_CONFIG = {
  draft: { color: "bg-slate-500/10 text-slate-500 border-slate-500/30", icon: FileText },
  active: { color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: Activity },
  running: { color: "bg-amber-500/10 text-amber-500 border-amber-500/30", icon: Loader2 },
  completed: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", icon: CheckCircle2 },
  partial: { color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: AlertCircle },
  error: { color: "bg-red-500/10 text-red-500 border-red-500/30", icon: AlertCircle },
};

export default function Dashboard() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartColors, setChartColors] = useState(CHART_COLORS.light);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      setChartColors(isDark ? CHART_COLORS.dark : CHART_COLORS.light);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load dashboard');
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const PIE_COLORS = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.tertiary,
    chartColors.quaternary,
    chartColors.fifth,
    chartColors.sixth,
  ];

  const tooltipStyle = {
    backgroundColor: chartColors.tooltipBg,
    border: `1px solid ${chartColors.tooltipBorder}`,
    borderRadius: '8px',
    color: isDarkMode ? '#f1f5f9' : '#0f172a'
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "emerald" }) => (
    <Card className="overflow-hidden border-border/40 backdrop-blur-sm bg-card/50 hover:bg-card/70 transition-all duration-300 hover:shadow-lg group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-${color}-500/10 group-hover:bg-${color}-500 transition-colors`}>
          <Icon className={`h-4 w-4 text-${color}-500 group-hover:text-white transition-colors`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Failed to load dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboard} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, workflowWordCounts, activityTimeline, creationTimeline, recentWorkflows } = data;

  // Prepare chart data
  const statusPieData = Object.entries(stats.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status.charAt(0).toUpperCase() + status.slice(1), value: count }));

  const wordCountBarData = workflowWordCounts
    .filter(w => w.wordCount > 0)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 10)
    .map(w => ({
      name: w.name.length > 20 ? w.name.substring(0, 20) + '...' : w.name,
      words: w.wordCount,
      status: w.status
    }));

  const videoAgentData = Object.entries(stats.videosByAgent || {}).map(([agent, count]) => ({
    name: agent,
    videos: count
  }));

  // Productivity radar data
  const totalDaysActive = activityTimeline.length;
  const avgSavesPerDay = totalDaysActive > 0
    ? (activityTimeline.reduce((s, d) => s + d.saves, 0) / totalDaysActive).toFixed(1)
    : 0;
  const completionRate = stats.totalWorkflows > 0
    ? Math.round((stats.statusCounts.completed / stats.totalWorkflows) * 100)
    : 0;
  const editIntensity = stats.totalVersions > 0
    ? Math.min(100, Math.round((stats.totalLinesAdded / Math.max(1, stats.totalVersions)) / 10 * 100))
    : 0;

  const productivityRadar = [
    { metric: "Workflows", value: Math.min(100, stats.totalWorkflows * 10), fullMark: 100 },
    { metric: "Word Output", value: Math.min(100, Math.round(stats.totalWords / 500)), fullMark: 100 },
    { metric: "Completion Rate", value: completionRate, fullMark: 100 },
    { metric: "Edit Activity", value: editIntensity, fullMark: 100 },
    { metric: "Consistency", value: Math.min(100, totalDaysActive * 3), fullMark: 100 },
    { metric: "Video Output", value: Math.min(100, stats.totalVideos * 5), fullMark: 100 },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              {data.user?.name ? `Welcome back, ${data.user.name}` : 'Your creative workspace at a glance'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => router.push('/workflows/create')}
            >
              <PenTool className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Workflows"
            value={stats.totalWorkflows}
            subtitle={`${stats.statusCounts.completed} completed, ${stats.statusCounts.active + stats.statusCounts.running} active`}
            icon={FolderOpen}
          />
          <StatCard
            title="Total Words Written"
            value={stats.totalWords.toLocaleString('en-IN')}
            subtitle={`Across ${workflowWordCounts.filter(w => w.wordCount > 0).length} scripts`}
            icon={BookOpen}
          />
          <StatCard
            title="Script Versions"
            value={stats.totalVersions}
            subtitle={`+${stats.totalLinesAdded.toLocaleString('en-IN')} / -${stats.totalLinesRemoved.toLocaleString('en-IN')} lines`}
            icon={Save}
          />
          <StatCard
            title="Videos Generated"
            value={stats.totalVideos}
            subtitle={`${stats.videoStatusCounts.completed} completed`}
            icon={Video}
          />
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50 backdrop-blur-sm flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Writing Activity</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Words per Workflow</CardTitle>
                  <CardDescription>
                    Word count across your top scripts
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  {wordCountBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={wordCountBarData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis type="number" stroke={chartColors.axis} style={{ fontSize: '12px' }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke={chartColors.axis}
                          style={{ fontSize: '11px' }}
                          width={140}
                          tick={{ fill: chartColors.axis }}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="words" fill={chartColors.primary} radius={[0, 4, 4, 0]} name="Words" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                      <div className="text-center">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No word count data yet</p>
                        <p className="text-xs mt-1">Start writing to see stats here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-3 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Workflow Status</CardTitle>
                  <CardDescription>
                    Distribution by current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statusPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {statusPieData.map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                              <span className="text-sm text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">{item.value} workflows</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No workflows yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Daily Save Activity</CardTitle>
                  <CardDescription>
                    Version saves per day (last 30 days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activityTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={activityTimeline}>
                        <defs>
                          <linearGradient id="colorSaves" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis
                          dataKey="date"
                          stroke={chartColors.axis}
                          style={{ fontSize: '10px' }}
                          tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis stroke={chartColors.axis} style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        />
                        <Area
                          type="monotone"
                          dataKey="saves"
                          stroke={chartColors.primary}
                          fillOpacity={1}
                          fill="url(#colorSaves)"
                          strokeWidth={2}
                          name="Saves"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No recent activity</p>
                        <p className="text-xs mt-1">Activity appears as you save versions</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Lines Changed</CardTitle>
                  <CardDescription>
                    Lines added vs removed per day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activityTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={activityTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis
                          dataKey="date"
                          stroke={chartColors.axis}
                          style={{ fontSize: '10px' }}
                          tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis stroke={chartColors.axis} style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        />
                        <Legend />
                        <Bar dataKey="linesAdded" fill={chartColors.primary} radius={[4, 4, 0, 0]} name="Lines Added" />
                        <Bar dataKey="linesRemoved" fill={chartColors.sixth} radius={[4, 4, 0, 0]} name="Lines Removed" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No edit history yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="productivity" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Productivity Radar</CardTitle>
                  <CardDescription>
                    Overall creative output across dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={productivityRadar}>
                      <PolarGrid stroke={chartColors.grid} />
                      <PolarAngleAxis
                        dataKey="metric"
                        stroke={chartColors.axis}
                        style={{ fontSize: '12px' }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        stroke={chartColors.axis}
                        style={{ fontSize: '10px' }}
                      />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.5}
                        strokeWidth={2}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {productivityRadar.map((item) => (
                      <div key={item.metric} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                        <p className="text-xs text-muted-foreground mb-1">{item.metric}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold">{item.value}%</p>
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Workflow Growth</CardTitle>
                  <CardDescription>
                    New workflows created over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {creationTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={creationTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="month" stroke={chartColors.axis} style={{ fontSize: '12px' }} />
                        <YAxis stroke={chartColors.axis} style={{ fontSize: '12px' }} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="workflows" fill={chartColors.quaternary} radius={[6, 6, 0, 0]} name="Workflows Created" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      <div className="text-center">
                        <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No growth data yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <Card className="border-border/40 backdrop-blur-sm bg-card/50">
              <CardHeader>
                <CardTitle>Recent Workflows</CardTitle>
                <CardDescription>
                  Your latest projects and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentWorkflows.length > 0 ? (
                  <div className="space-y-3">
                    {recentWorkflows.map((workflow) => {
                      const config = STATUS_CONFIG[workflow.status] || STATUS_CONFIG.draft;
                      const StatusIcon = config.icon;
                      return (
                        <div
                          key={workflow.id}
                          onClick={() => router.push(`/workflows/${workflow.id}`)}
                          className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`p-2 rounded-full ${config.color}`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate group-hover:text-emerald-500 transition-colors">
                                {workflow.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {workflow.nodeCount} nodes
                                {workflow.description && ` · ${workflow.description.substring(0, 50)}${workflow.description.length > 50 ? '...' : ''}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <Badge variant="outline" className={config.color}>
                              {workflow.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {new Date(workflow.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <h3 className="font-semibold text-foreground mb-1">No workflows yet</h3>
                    <p className="text-sm mb-4">Create your first workflow to get started</p>
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => router.push('/workflows/create')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow word counts breakdown */}
            {wordCountBarData.length > 0 && (
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Script Length Comparison</CardTitle>
                  <CardDescription>Word count across your scripts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={wordCountBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="name" stroke={chartColors.axis} style={{ fontSize: '10px' }} angle={-20} textAnchor="end" height={60} />
                      <YAxis stroke={chartColors.axis} style={{ fontSize: '12px' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="words" fill={chartColors.secondary} radius={[6, 6, 0, 0]} name="Words" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.videoStatusCounts.completed} completed, {stats.videoStatusCounts.processing} processing
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalVideos > 0
                      ? Math.round((stats.videoStatusCounts.completed / stats.totalVideos) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.videoStatusCounts.failed} failed
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agent Types</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(stats.videosByAgent || {}).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Different generation agents used
                  </p>
                </CardContent>
              </Card>
            </div>

            {videoAgentData.length > 0 && (
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle>Videos by Agent Type</CardTitle>
                  <CardDescription>
                    Distribution of generated videos across agent types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={videoAgentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="name" stroke={chartColors.axis} style={{ fontSize: '12px' }} />
                      <YAxis stroke={chartColors.axis} style={{ fontSize: '12px' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="videos" fill={chartColors.fifth} radius={[6, 6, 0, 0]} name="Videos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {videoAgentData.length === 0 && (
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <h3 className="font-semibold text-foreground mb-1">No videos generated yet</h3>
                    <p className="text-sm">Use the video generation agents in your workflows to see stats here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push('/workflows/create')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">New Workflow</CardTitle>
                  <CardDescription>Create a new script workflow</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push('/story-graph')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Knowledge Graph</CardTitle>
                  <CardDescription>Explore story connections</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push('/workflows')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">All Workflows</CardTitle>
                  <CardDescription>Browse your projects</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
