"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StaggeredMenu from "@/components/StaggeredMenu";

export default function WorkflowsLayout({ children }) {
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');
  const pathname = usePathname();
  
  // Check if we're on a workflow canvas page (e.g., /workflows/abc123)
  // Don't show navbar on individual workflow pages
  const isWorkflowCanvasPage = /^\/workflows\/[^\/]+$/.test(pathname);

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

  // If on workflow canvas, render only children without navbar
  if (isWorkflowCanvasPage) {
    return <main className="h-screen w-screen overflow-hidden">{children}</main>;
  }

  return (
    <>
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <StaggeredMenu
            position="right"
            isFixed={true}
            logoUrl="/chain-forecast.svg"
            accentColor="#10b981"
            colors={["#0f172a", "#111827", "#1f2937"]}
            menuButtonColor={menuBtnColor}
            openMenuButtonColor="#10b981"
            items={[
              { label: "Home", link: "/", ariaLabel: "Go to Home" },
              { label: "Dashboard", link: "/dashboard", ariaLabel: "View Dashboard" },
              { label: "Workflows", link: "/workflows", ariaLabel: "Script Workflows" },
              { label: "Campaign AI", link: "/campaign", ariaLabel: "AI Campaign Generator" },
              { label: "Assistant", link: "/assistant", ariaLabel: "AI Assistant" },
              { label: "Profile", link: "/profile", ariaLabel: "View Profile" },
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </>
  );
}
