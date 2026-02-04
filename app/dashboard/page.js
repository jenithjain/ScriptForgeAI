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
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp,
  CreditCard, Activity, Users, ShoppingCart, Wallet, Target,
  PiggyBank, TrendingDown, Sparkles
} from "lucide-react";

// Sales Forecasting Data (Historical + 4-Week Forecast)
const revenueData = [
  { month: "Week 1", actual: 45000, forecast: 45000, confidence: 100 },
  { month: "Week 2", actual: 52000, forecast: 52000, confidence: 100 },
  { month: "Week 3", actual: 48000, forecast: 48000, confidence: 100 },
  { month: "Week 4", actual: 61000, forecast: 61000, confidence: 100 },
  { month: "Week 5", actual: 55000, forecast: 55000, confidence: 100 },
  { month: "Week 6", actual: 67000, forecast: 67000, confidence: 100 },
  { month: "Week 7", actual: 72000, forecast: 72000, confidence: 100 },
  { month: "Week 8", actual: 69000, forecast: 69000, confidence: 100 },
  { month: "Week 9", actual: null, forecast: 73200, confidence: 92 },
  { month: "Week 10", actual: null, forecast: 76800, confidence: 88 },
  { month: "Week 11", actual: null, forecast: 81500, confidence: 85 },
  { month: "Week 12", actual: null, forecast: 85300, confidence: 82 },
];

const customerSegmentData = [
  { name: "Champions", value: 28, count: 2847, avgSpend: 8500 },
  { name: "Loyal Customers", value: 22, count: 2234, avgSpend: 5200 },
  { name: "At Risk", value: 18, count: 1829, avgSpend: 3800 },
  { name: "New Customers", value: 32, count: 3251, avgSpend: 2100 },
];

const suggestedOffersData = [
  { id: 1, segment: "Champions", offer: "VIP Loyalty Program - 25% Off", priority: "High", expectedROI: "+340%" },
  { id: 2, segment: "Champions", offer: "Early Access to New Products", priority: "High", expectedROI: "+280%" },
  { id: 3, segment: "Loyal Customers", offer: "Bundle Discount - 15% Off", priority: "Medium", expectedROI: "+220%" },
  { id: 4, segment: "At Risk", offer: "Win-Back Campaign - 30% Off", priority: "High", expectedROI: "+180%" },
  { id: 5, segment: "At Risk", offer: "Personalized Re-engagement Email", priority: "Medium", expectedROI: "+150%" },
  { id: 6, segment: "New Customers", offer: "Welcome Offer - 10% Off Next Purchase", priority: "Medium", expectedROI: "+125%" },
  { id: 7, segment: "Loyal Customers", offer: "Referral Rewards Program", priority: "Low", expectedROI: "+95%" },
  { id: 8, segment: "New Customers", offer: "First Purchase Free Shipping", priority: "Low", expectedROI: "+85%" },
];

const investmentData = [
  { month: "Jan", portfolio: 125000, target: 130000 },
  { month: "Feb", portfolio: 132000, target: 135000 },
  { month: "Mar", portfolio: 128000, target: 140000 },
  { month: "Apr", portfolio: 145000, target: 145000 },
  { month: "May", portfolio: 152000, target: 150000 },
  { month: "Jun", portfolio: 148000, target: 155000 },
  { month: "Jul", portfolio: 165000, target: 160000 },
  { month: "Aug", portfolio: 171000, target: 165000 },
  { month: "Sep", portfolio: 168000, target: 170000 },
  { month: "Oct", portfolio: 182000, target: 175000 },
];

const performanceData = [
  { metric: "Revenue Growth", value: 85, fullMark: 100 },
  { metric: "Cost Efficiency", value: 72, fullMark: 100 },
  { metric: "Customer Satisfaction", value: 90, fullMark: 100 },
  { metric: "Market Position", value: 78, fullMark: 100 },
  { metric: "Innovation", value: 82, fullMark: 100 },
  { metric: "Team Productivity", value: 88, fullMark: 100 },
];

const cashFlowData = [
  { quarter: "Q1", inflow: 180000, outflow: 120000, net: 60000 },
  { quarter: "Q2", inflow: 210000, outflow: 135000, net: 75000 },
  { quarter: "Q3", inflow: 245000, outflow: 155000, net: 90000 },
  { quarter: "Q4", inflow: 280000, outflow: 170000, net: 110000 },
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
              Sales Forecasting & CRM Dashboard
            </h1>
            <p className="text-muted-foreground ivy-font">
              AI-powered sales predictions and customer segmentation analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 ivy-font">
              November 2025
            </Badge>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white ivy-font">
              <Target className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Forecasted Sales (4 Weeks)"
            value="$316.8K"
            change="+18.3%"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title="Total Customers"
            value="10,161"
            change="+5.2%"
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Champions Segment"
            value="2,847"
            change="+12.8%"
            icon={Target}
            trend="up"
          />
          <StatCard
            title="Avg Customer Value"
            value="$4,925"
            change="+7.4%"
            icon={DollarSign}
            trend="up"
          />
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="ivy-font">Sales Forecast</TabsTrigger>
            <TabsTrigger value="analytics" className="ivy-font">Customer Segments</TabsTrigger>
            <TabsTrigger value="performance" className="ivy-font">Campaign Performance</TabsTrigger>
            <TabsTrigger value="cashflow" className="ivy-font">Trend Analysis</TabsTrigger>
            <TabsTrigger value="investments" className="ivy-font">RFM Insights</TabsTrigger>
            <TabsTrigger value="transactions" className="ivy-font">Suggested Offers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="ivy-font">4-Week Sales Forecast</CardTitle>
                  <CardDescription className="ivy-font">
                    AI-powered predictions with confidence intervals (Weeks 9-12)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={revenueData}>
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
                          borderRadius: '8px',
                          color: isDarkMode ? '#f1f5f9' : '#0f172a'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke={chartColors.revenue} 
                        fillOpacity={1} 
                        fill="url(#colorActual)"
                        strokeWidth={2}
                        name="Historical Sales"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke={chartColors.profit} 
                        fillOpacity={1} 
                        fill="url(#colorForecast)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Forecasted Sales"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-3 border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="ivy-font">Customer Segmentation (RFM)</CardTitle>
                  <CardDescription className="ivy-font">
                    Distribution by value tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={customerSegmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {customerSegmentData.map((entry, index) => (
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
                    {customerSegmentData.map((seg, idx) => (
                      <div key={seg.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: PIE_COLORS[idx] }}
                          />
                          <span className="text-sm text-muted-foreground ivy-font">{seg.name}</span>
                        </div>
                        <span className="text-sm font-medium ivy-font">{seg.count} customers</span>
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
                  <CardTitle className="ivy-font">Profit Trends</CardTitle>
                  <CardDescription className="ivy-font">
                    Net profit over the last 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
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
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
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
                  <CardTitle className="ivy-font">Monthly Comparison</CardTitle>
                  <CardDescription className="ivy-font">
                    Revenue, expenses, and profit side by side
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.slice(-6)}>
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
                      <Bar dataKey="revenue" fill={chartColors.revenue} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill={chartColors.expenses} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill={chartColors.profit} radius={[4, 4, 0, 0]} />
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
                <CardTitle className="ivy-font">Performance Metrics</CardTitle>
                <CardDescription className="ivy-font">
                  Comprehensive view of business performance across key areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={performanceData}>
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
                      name="Performance" 
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
                  {performanceData.map((item, idx) => (
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
                <CardTitle className="ivy-font">Quarterly Cash Flow Analysis</CardTitle>
                <CardDescription className="ivy-font">
                  Track cash inflows, outflows, and net cash position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="quarter" 
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
                    <Bar dataKey="inflow" fill={chartColors.revenue} radius={[8, 8, 0, 0]} name="Cash Inflow" />
                    <Bar dataKey="outflow" fill={chartColors.expenses} radius={[8, 8, 0, 0]} name="Cash Outflow" />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke={chartColors.profit} 
                      strokeWidth={3}
                      name="Net Cash Flow"
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

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium ivy-font">
                    Portfolio Value
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ivy-font">$182,000</div>
                  <p className="text-xs text-muted-foreground ivy-font">
                    +8.2% from last month
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium ivy-font">
                    Target Value
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ivy-font">$175,000</div>
                  <p className="text-xs text-emerald-500 ivy-font">
                    Target achieved! 🎉
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 backdrop-blur-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium ivy-font">
                    ROI
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ivy-font">+45.6%</div>
                  <p className="text-xs text-muted-foreground ivy-font">
                    Year to date
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/40 backdrop-blur-sm bg-card/50">
              <CardHeader>
                <CardTitle className="ivy-font">Portfolio Performance</CardTitle>
                <CardDescription className="ivy-font">
                  Your portfolio value vs target over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={investmentData}>
                    <defs>
                      <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.portfolio} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.portfolio} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                    <Area 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke={chartColors.portfolio} 
                      fillOpacity={1} 
                      fill="url(#colorPortfolio)"
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
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
                <CardTitle className="ivy-font">AI-Recommended Campaign Offers</CardTitle>
                <CardDescription className="ivy-font">
                  Targeted offers for each customer segment with expected ROI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestedOffersData.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          offer.priority === "High" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : offer.priority === "Medium"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {offer.priority === "High" ? (
                            <Target className="h-4 w-4" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground ivy-font">
                            {offer.offer}
                          </p>
                          <p className="text-sm text-muted-foreground ivy-font">
                            {offer.segment} • {offer.priority} Priority
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-500 ivy-font">
                          {offer.expectedROI} ROI
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {offer.segment}
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
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg ivy-font">Refresh Forecast</CardTitle>
                  <CardDescription className="ivy-font">Update AI predictions</CardDescription>
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
                  <CardTitle className="text-lg ivy-font">Run Segmentation</CardTitle>
                  <CardDescription className="ivy-font">Update RFM analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/40 backdrop-blur-sm bg-card/50 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg ivy-font">Launch Campaign</CardTitle>
                  <CardDescription className="ivy-font">Execute AI workflow</CardDescription>
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
