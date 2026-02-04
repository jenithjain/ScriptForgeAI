"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StaggeredMenu from "@/components/StaggeredMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, Search, TrendingUp, BarChart3, 
  Sparkles, ArrowLeft 
} from "lucide-react";

export default function NotFound() {
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');

  useEffect(() => {
    // Set initial color
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMenuBtnColor(isDark ? '#ffffff' : '#000000');
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
              { label: "Features", link: "/#features", ariaLabel: "View Features" },
              { label: "Login", link: "/login", ariaLabel: "Login to your account" },
            ]}
            socialItems={[
              { label: "LinkedIn", link: "https://linkedin.com" },
              { label: "Twitter", link: "https://x.com" },
              { label: "GitHub", link: "https://github.com" },
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen w-full flex items-center justify-center p-4 pt-24 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        </div>

      <div className="w-full max-w-4xl relative z-10">
        <Card className="border-border/40 backdrop-blur-xl bg-card/80 shadow-2xl p-8 sm:p-12">
          <div className="text-center space-y-6">
            {/* 404 Number with gradient */}
            <div className="relative">
              <h1 className="text-9xl sm:text-[12rem] font-bold bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent leading-none ivy-font">
                404
              </h1>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Badge */}
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
              Page Not Found
            </Badge>

            {/* Title and Description */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground ivy-font">
                Oops! Page not found
              </h2>
              <p className="text-lg text-muted-foreground ivy-font">
                The page you're looking for doesn't exist in our ScriptForge system. 
                Let's get you back to your writing projects and story dashboard!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white ivy-font"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="ivy-font"
              >
                <Link href="/dashboard">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Quick Links */}
            <div className="pt-12">
              <p className="text-sm text-muted-foreground mb-4 ivy-font">
                Or try one of these popular pages:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {[
                  { 
                    icon: Home, 
                    label: "Home", 
                    href: "/",
                    color: "text-emerald-600 dark:text-emerald-400"
                  },
                  { 
                    icon: BarChart3, 
                    label: "Dashboard", 
                    href: "/dashboard",
                    color: "text-teal-600 dark:text-teal-400"
                  },
                  { 
                    icon: Sparkles, 
                    label: "AI Assistant", 
                    href: "/assistant",
                    color: "text-cyan-600 dark:text-cyan-400"
                  }
                ].map((link, idx) => (
                  <Link 
                    key={idx}
                    href={link.href}
                    className="group"
                  >
                    <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-border/40 backdrop-blur-sm bg-card/50">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <link.icon className={`w-6 h-6 ${link.color}`} />
                        </div>
                        <span className="font-semibold text-foreground ivy-font">
                          {link.label}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Help Text */}
            <div className="pt-8 border-t border-border/40 mt-8">
              <p className="text-sm text-muted-foreground ivy-font">
                Need help? <Link href="/#contact" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline">Contact our support team</Link>
              </p>
            </div>
          </div>
        </Card>

        {/* Floating decoration elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-500/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>
      </div>
    </main>
  );
}
