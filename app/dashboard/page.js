"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from "recharts";
import {
  ArrowUpRight, ArrowDownRight, BookOpen, TrendingUp,
  Users, Activity, GitBranch, FileText, Sparkles, Brain,
  PenTool, Target, Network, Shield
} from "lucide-react";

// Story Progress Data
const progressData = [
  { chapter: "Ch 1", wordCount: 4500, targetCount: 5000, completion: 90 },
  { chapter: "Ch 2", wordCount: 5200, targetCount: 5000, completion: 100 },
  { chapter: "Ch 3", wordCount: 4800, targetCount: 5000, completion: 96 },
  { chapter: "Ch 4", wordCount: 6100, targetCount: 5000, completion: 100 },
  { chapter: "Ch 5", wordCount: 5500, targetCount: 5000, completion: 100 },
  { chapter: "Ch 6", wordCount: 6700, targetCount: 5000, completion: 100 },
  { chapter: "Ch 7", wordCount: 7200, targetCount: 5000, completion: 100 },
  { chapter: "Ch 8", wordCount: 6900, targetCount: 5000, completion: 100 },
  { chapter: "Ch 9", wordCount: 3200, targetCount: 5000, completion: 64 },
  { chapter: "Ch 10", wordCount: 0, targetCount: 5000, completion: 0 },
  { chapter: "Ch 11", wordCount: 0, targetCount: 5000, completion: 0 },
  { chapter: "Ch 12", wordCount: 0, targetCount: 5000, completion: 0 },
];

const characterActivityData = [
  { name: "Sarah", appearances: 28, dialogueLines: 284, arcProgress: 85 },
  { name: "Marcus", appearances: 22, dialogueLines: 223, arcProgress: 72 },
  { name: "Elena", appearances: 18, dialogueLines: 182, arcProgress: 68 },
  { name: "Detective Ray", appearances: 15, dialogueLines: 151, arcProgress: 55 },
];

const storyElementsData = [
  { id: 1, type: "Plot Thread", element: "The Mystery of the Missing Journal", status: "Active", chapters: "1-9" },
  { id: 2, type: "Plot Thread", element: "Sarah's Transformation Arc", status: "Active", chapters: "1-9" },
  { id: 3, type: "Subplot", element: "Marcus and Elena's Romance", status: "Active", chapters: "3-9" },
  { id: 4, type: "Plot Thread", element: "The Corporate Conspiracy", status: "Resolved", chapters: "1-7" },
  { id: 5, type: "Subplot", element: "Detective Ray's Investigation", status: "Active", chapters: "2-9" },
  { id: 6, type: "Mystery", element: "Who sent the anonymous letter?", status: "Active", chapters: "5-9" },
  { id: 7, type: "Character", element: "Sarah's mentor relationship", status: "Active", chapters: "2-9" },
  { id: 8, type: "Location", element: "The Old Library recurring setting", status: "Active", chapters: "1-9" },
];

const timelineData = [
  { chapter: "Ch 1", events: 12, characters: 4 },
  { chapter: "Ch 2", events: 13, characters: 5 },
  { chapter: "Ch 3", events: 14, characters: 5 },
  { chapter: "Ch 4", events: 14, characters: 6 },
  { chapter: "Ch 5", events: 15, characters: 6 },
  { chapter: "Ch 6", events: 14, characters: 7 },
  { chapter: "Ch 7", events: 16, characters: 7 },
  { chapter: "Ch 8", events: 17, characters: 8 },
  { chapter: "Ch 9", events: 16, characters: 8 },
  { chapter: "Ch 10", events: 0, characters: 0 },
];

const storyHealthData = [
  { metric: "Character Consistency", value: 95, fullMark: 100 },
  { metric: "Timeline Coherence", value: 88, fullMark: 100 },
  { metric: "Plot Thread Management", value: 92, fullMark: 100 },
  { metric: "Dialogue Quality", value: 85, fullMark: 100 },
  { metric: "Pacing", value: 78, fullMark: 100 },
  { metric: "Continuity Score", value: 91, fullMark: 100 },
];

const chapterStatsData = [
  { chapter: "Q1", wordsWritten: 18000, targetWords: 20000, revisions: 6 },
  { chapter: "Q2", wordsWritten: 21000, targetWords: 20000, revisions: 7 },
  { chapter: "Q3", wordsWritten: 24500, targetWords: 20000, revisions: 9 },
  { chapter: "Q4", wordsWritten: 28000, targetWords: 20000, revisions: 11 },
];

const CHART_COLORS = {
  light: {
    primary: "#10b981",    // emerald-500
    secondary: "#3b82f6",  // blue-500
    tertiary: "#f59e0b",   // amber-500
    quaternary: "#8b5cf6", // violet-500
    profit: "#10b981",
    revenue: "#3b82f6",
    expenses: "#ef4444",
    portfolio: "#8b5cf6",
    target: "#94a3b8",
  },
  dark: {
    primary: "#34d399",    // emerald-400
    secondary: "#60a5fa",  // blue-400
    tertiary: "#fbbf24",   // amber-400
    quaternary: "#a78bfa", // violet-400
    profit: "#34d399",
    revenue: "#60a5fa",
    expenses: "#f87171",
    portfolio: "#a78bfa",
    target: "#64748b",
  }
};

export default function Dashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartColors, setChartColors] = useState(CHART_COLORS.light);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      setChartColors(isDark ? CHART_COLORS.dark : CHART_COLORS.light);
    };
    
    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const PIE_COLORS = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.tertiary,
    chartColors.quaternary,
  ];

  const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <Card className="overflow-hidden border-border/40 backdrop-blur-sm bg-card/50 hover:bg-card/70 transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground ivy-font group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500 transition-colors">
          <Icon className="h-4 w-4 text-emerald-500 group-hover:text-white transition-colors" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground ivy-font">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {trend === "up" ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span className={trend === "up" ? "text-emerald-500" : "text-red-500"}>
            {change}
          </span>
          <span>from last month</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground ivy-font mb-2">
              Story Writing Dashboard
            </h1>
            <p className="text-muted-foreground ivy-font">
              Track your narrative progress, character arcs, and story continuity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 ivy-font">
              Chapter 9 - In Progress
            </Badge>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white ivy-font">
              <PenTool className="h-4 w-4 mr-2" />
              Continue Writing
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Word Count"
            value="49,900"
            change="+15.2%"
            icon={BookOpen}
            trend="up"
          />
          <StatCard
            title="Characters Tracked"
            value="12"
            change="+3"
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Active Plot Threads"
            value="5"
            change="+1"
            icon={GitBranch}
            trend="up"
          />
          <StatCard
            title="Continuity Score"
            value="91%"
            change="+2.4%"
            icon={Shield}
            trend="up"
          />
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="ivy-font">Writing Progress</TabsTrigger>
            <TabsTrigger value="analytics" className="ivy-font">Character Activity</TabsTrigger>
            <TabsTrigger value="performance" className="ivy-font">Story Health</TabsTrigger>
            <TabsTrigger value="cashflow" className="ivy-font">Timeline Events</TabsTrigger>
            <TabsTrigger value="investments" className="ivy-font">Chapter Stats</TabsTrigger>
            <TabsTrigger value="transactions" className="ivy-font">Story Elements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="ivy-font">Chapter Progress</CardTitle>
                  <CardDescription className="ivy-font">
                    Word count progress across chapters with target completion
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.revenue} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColors.revenue} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.profit} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColors.profit} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="chapter" 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f1f5f9' : '#0f172a'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="wordCount" 
                        stroke={chartColors.revenue} 
                        fillOpacity={1} 
                        fill="url(#colorActual)"
                        strokeWidth={2}
                        name="Word Count"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="targetCount" 
                        stroke={chartColors.profit} 
                        fillOpacity={1} 
                        fill="url(#colorForecast)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target Count"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-3 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="ivy-font">Character Activity</CardTitle>
                  <CardDescription className="ivy-font">
                    Distribution by character prominence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={characterActivityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="appearances"
                      >
                        {characterActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {characterActivityData.map((character, idx) => (
                      <div key={character.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: PIE_COLORS[idx] }}
                          />
                          <span className="text-sm text-muted-foreground ivy-font">{character.name}</span>
                        </div>
                        <span className="text-sm font-medium ivy-font">{character.appearances} appearances</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="ivy-font">Chapter Trends</CardTitle>
                  <CardDescription className="ivy-font">
                    Progress across the manuscript
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="chapter" 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="wordCount" 
                        stroke={chartColors.profit} 
                        strokeWidth={3}
                        dot={{ fill: chartColors.profit, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="ivy-font">Timeline Events</CardTitle>
                  <CardDescription className="ivy-font">
                    Events and characters per chapter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="month" 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="events" fill={chartColors.revenue} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="characters" fill={chartColors.profit} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="ivy-font">Story Health Metrics</CardTitle>
                <CardDescription className="ivy-font">
                  Comprehensive view of story quality across key areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={storyHealthData}>
                    <PolarGrid stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      style={{ fontSize: '12px' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      style={{ fontSize: '10px' }}
                    />
                    <Radar 
                      name="Quality" 
                      dataKey="value" 
                      stroke={chartColors.primary} 
                      fill={chartColors.primary} 
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {storyHealthData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:scale-105 cursor-pointer">
                      <p className="text-sm text-muted-foreground ivy-font mb-1">{item.metric}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold ivy-font">{item.value}%</p>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Tab */}
          <TabsContent value="cashflow" className="space-y-4">
            <Card className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="ivy-font">Writing Activity by Quarter</CardTitle>
                <CardDescription className="ivy-font">
                  Track words written, targets, and revision rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chapterStatsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="chapter" 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="wordsWritten" fill={chartColors.revenue} radius={[8, 8, 0, 0]} name="Words Written" />
                    <Bar dataKey="targetWords" fill={chartColors.expenses} radius={[8, 8, 0, 0]} name="Target Words" />
                    <Line 
                      type="monotone" 
                      dataKey="revisions" 
                      stroke={chartColors.profit} 
                      strokeWidth={3}
                      name="Revisions"
                      dot={{ fill: chartColors.profit, r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all hover:scale-105 cursor-pointer">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 ivy-font mb-1">Total Inflow</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 ivy-font">$915K</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all hover:scale-105 cursor-pointer">
                    <p className="text-sm text-red-600 dark:text-red-400 ivy-font mb-1">Total Outflow</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 ivy-font">$580K</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-all hover:scale-105 cursor-pointer">
                    <p className="text-sm text-blue-600 dark:text-blue-400 ivy-font mb-1">Net Position</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 ivy-font">$335K</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chapter Stats Tab */}
          <TabsContent value="investments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium ivy-font">
                    Total Scenes
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ivy-font">127</div>
                  <p className="text-xs text-muted-foreground ivy-font">
                    +12 from last week
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium ivy-font">
                    Script Pages
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ivy-font">94 pages</div>
                  <p className="text-xs text-emerald-500 ivy-font">
                    On track! 📝
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium ivy-font">
                    Draft Completion
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ivy-font">78%</div>
                  <p className="text-xs text-muted-foreground ivy-font">
                    First draft progress
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/40 backdrop-blur-sm bg-card/50">
              <CardHeader>
                <CardTitle className="ivy-font">Chapter Completion Over Time</CardTitle>
                <CardDescription className="ivy-font">
                  Your word count vs target over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.portfolio} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.portfolio} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="chapter" 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="wordCount" 
                      stroke={chartColors.portfolio} 
                      fillOpacity={1} 
                      fill="url(#colorPortfolio)"
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="targetCount" 
                      stroke={chartColors.target} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suggested Offers Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="border-border/40 backdrop-blur-sm bg-card/50">
              <CardHeader>
                <CardTitle className="ivy-font">Story Elements Tracker</CardTitle>
                <CardDescription className="ivy-font">
                  Active plot threads, characters, and story elements across chapters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storyElementsData.map((element) => (
                    <div
                      key={element.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          element.status === "Active" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : element.status === "Resolved"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-slate-500/10 text-slate-500"
                        }`}>
                          {element.status === "Active" ? (
                            <Activity className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground ivy-font">
                            {element.element}
                          </p>
                          <p className="text-sm text-muted-foreground ivy-font">
                            {element.type} • Chapters {element.chapters}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-500 ivy-font">
                          {element.status}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {element.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg ivy-font">Check Continuity</CardTitle>
                  <CardDescription className="ivy-font">Run consistency check</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg ivy-font">Get Suggestions</CardTitle>
                  <CardDescription className="ivy-font">AI creative ideas</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg ivy-font">Start Writing</CardTitle>
                  <CardDescription className="ivy-font">Continue your story</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
