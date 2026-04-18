"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import StaggeredMenu from "@/components/StaggeredMenu";
import ModelViewer from "@/components/ModelViewer";
import LaserFlow from "@/components/LaserFlow";
import Footer from "@/components/Footer";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain, Sparkles, Search, FileText, Shield, Users
} from "lucide-react";

const FEATURE_ICON_MAP = {
  brain: Brain,
  shield: Shield,
  sparkles: Sparkles,
  search: Search,
  fileText: FileText,
  users: Users,
};

const FEATURE_ITEMS = [
  {
    icon: "brain",
    iconContainerClass: "bg-emerald-500/10 group-hover:bg-emerald-500",
    iconClass: "text-emerald-500 group-hover:text-white",
    title: "Knowledge Graph Story Memory",
    description:
      "Dynamic knowledge graph tracks all story entities and relationships - characters, locations, objects, events, and timelines evolve as your story progresses",
  },
  {
    icon: "shield",
    iconContainerClass: "bg-blue-500/10 group-hover:bg-blue-500",
    iconClass: "text-blue-500 group-hover:text-white",
    title: "Continuity Validation System",
    description:
      "Intelligent consistency checking detects contradictions from simple errors to complex timeline issues while recognizing intentional narrative devices",
  },
  {
    icon: "sparkles",
    iconContainerClass: "bg-purple-500/10 group-hover:bg-purple-500",
    iconClass: "text-purple-500 group-hover:text-white",
    title: "AI Creative Assistant",
    description:
      "Intelligent creative support suggests scene ideas, dialogue enhancements, and plot developments that match your established style and vision",
  },
  {
    icon: "search",
    iconContainerClass: "bg-amber-500/10 group-hover:bg-amber-500",
    iconClass: "text-amber-500 group-hover:text-white",
    title: "Intelligent Recall & Navigation",
    description:
      "Ask questions in natural language about any story element and receive precise answers with passage references and automated summaries",
  },
  {
    icon: "fileText",
    iconContainerClass: "bg-red-500/10 group-hover:bg-red-500",
    iconClass: "text-red-500 group-hover:text-white",
    title: "Multi-Format Support",
    description:
      "Compatible with screenplays, novels, episodic scripts, and mixed formats - adapts to your writing style and genre conventions",
  },
  {
    icon: "users",
    iconContainerClass: "bg-teal-500/10 group-hover:bg-teal-500",
    iconClass: "text-teal-500 group-hover:text-white",
    title: "Collaboration Support",
    description:
      "Shared story knowledge base for writing teams with collaborative editing and role-based permissions for different contributors",
  },
];

export default function Home() {
  const modelUrl = "/models/paladins_book.glb";
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    // Set initial color
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMenuBtnColor(isDark ? '#ffffff' : '#000000');
      setIsDarkMode(isDark);
    };
    
    updateColor();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
  <main className="relative min-h-screen w-full">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <StaggeredMenu
            position="right"
            isFixed={true}
            logoUrl="/chain-forecast.svg"
            accentColor="#22c55e"
            colors={["#0f172a", "#111827", "#1f2937"]}
            menuButtonColor={menuBtnColor}
            openMenuButtonColor="#22c55e"
            items={[
              { label: "Home", link: "/", ariaLabel: "Go to Home" },
              { label: "Dashboard", link: "/dashboard", ariaLabel: "View Dashboard" },
              { label: "Workflows", link: "/workflows", ariaLabel: "Script Workflows" },
              session
                ? { label: "Profile", link: "/profile", ariaLabel: "View your profile" }
                : { label: "Login", link: "/login", ariaLabel: "Login to your account" },
            ]}
            socialItems={[
              { label: "LinkedIn", link: "https://linkedin.com" },
              { label: "Twitter", link: "https://x.com" },
              { label: "GitHub", link: "https://github.com" },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section id="hero" className="relative z-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 sm:gap-10 px-4 sm:px-6 pb-16 sm:pb-24 pt-20 sm:pt-28 md:grid-cols-2 md:gap-12 md:pb-28 md:pt-36 lg:gap-16">
          {/* Left: Copy */}
          <div className="order-2 flex flex-col items-start md:order-1">
            <div className="mb-4 sm:mb-6 flex items-center gap-3">
              <img
                src="/chain-forecast.svg"
                alt="ScriptForge"
                className="h-12 sm:h-16 w-auto dark:invert"
              />
              <div className="leading-tight">
                <div className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">ScriptForge</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Smart Script Writing Assistant</div>
              </div>
            </div>

            <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-5xl xl:text-6xl">
              Write scripts with
              <span className="ml-2 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                AI precision
              </span>
            </h1>
            <p className="mb-6 sm:mb-8 max-w-xl text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Maintain perfect narrative continuity across long-form scripts, screenplays, and stories. Track characters, timelines, and plot threads with intelligent AI assistance that understands your creative vision.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href="/login"
                className="rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:bg-emerald-600 text-center backdrop-blur-sm"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="rounded-xl border border-slate-300 bg-white/80 backdrop-blur-sm px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-slate-900 transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900 text-center"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Right: 3D Model */}
          <div className="order-1 md:order-2 w-full relative">
            <div className="rounded-2xl shadow-lg overflow-hidden">
              <div className="w-full aspect-square max-w-[570px] mx-auto">
                <ModelViewer
                  key={pathname}
                  url={modelUrl}
                  defaultRotationX={10}
                  defaultZoom={1.0}
                  minZoomDistance={0.3}
                  maxZoomDistance={3.5}
                  enableManualZoom={true}
                  environmentPreset="city"
                  enableMouseParallax={true}
                  showScreenshotButton={false}
                  enableManualRotation={true}
                  autoRotate={true}
                  autoRotateSpeed={0.5}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with LaserFlow */}
      <section id="features" className="relative z-10 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Everything you need for
              <span className="block mt-2 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Perfect Story Continuity
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered story tracking, intelligent continuity checking, and creative assistance for screenplays, novels, and long-form narratives
            </p>
          </div>

          {/* LaserFlow Background Feature */}
          <div className="relative rounded-3xl overflow-hidden border border-border/40 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 backdrop-blur-sm mb-12 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left: Text Content */}
              <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex items-start md:items-center">
                <div className="max-w-xl">

                  <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                    Contextual Story Engine
                  </h3>
                  <p className="text-lg text-slate-700 dark:text-slate-200 mb-5">
                    Maintains deep context awareness across your entire manuscript, automatically tracking characters, locations, events, and relationships as you write. Never lose track of story details again.
                  </p>
                  <a
                    href="/login"
                    className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                  >
                    Start Writing
                  </a>
                </div>
              </div>

              {/* Right: LaserFlow Animation */}
              <div className="relative min-h-[400px] md:min-h-[450px]">
                <div className="absolute inset-0 opacity-80 dark:opacity-100">
                  <LaserFlow
                    className="w-full h-full"
                    color={isDarkMode ? "#10b981" : "#059669"}
                    wispDensity={1.2}
                    flowSpeed={0.4}
                    fogIntensity={isDarkMode ? 0.35 : 0.25}
                    wispSpeed={12}
                    verticalSizing={2.2}
                    horizontalSizing={0.6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_ITEMS.map((feature) => {
              const Icon = FEATURE_ICON_MAP[feature.icon];
              return (
                <Card
                  key={feature.title}
                  className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer"
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${feature.iconContainerClass}`}>
                      {Icon ? <Icon className={`h-6 w-6 transition-colors ${feature.iconClass}`} /> : null}
                    </div>
                    <CardTitle className="text-xl ivy-font">{feature.title}</CardTitle>
                    <CardDescription className="ivy-font">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
