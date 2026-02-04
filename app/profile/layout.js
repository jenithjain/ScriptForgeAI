"use client";

import { useState, useEffect } from "react";
import StaggeredMenu from "@/components/StaggeredMenu";

export default function ProfileLayout({ children }) {
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');

  useEffect(() => {
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMenuBtnColor(isDark ? '#ffffff' : '#000000');
    };
    
    updateColor();
    
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
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
