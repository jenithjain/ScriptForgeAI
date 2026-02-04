"use client";

import { useState, useEffect } from "react";
import LiquidEther from "./LiquidEther";

export default function BackgroundWrapper({ children }) {
  const [colors, setColors] = useState(['#5227FF', '#FF9FFC', '#B19EEF']);

  useEffect(() => {
    // Set initial colors based on theme
    const updateColors = () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        // Dark mode: vibrant colors
        setColors(['#5227FF', '#FF9FFC', '#B19EEF']);
      } else {
        // Light mode: subtle white and gray tones
        setColors(['#ffffff', '#f1f5f9', '#e2e8f0']);
      }
    };
    
    updateColors();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Fixed background layer - does not block clicks */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LiquidEther
          colors={colors}
          mouseForce={10}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          inputTarget="document"
        />
      </div>
      
      {/* Content layer */}
      <div className="relative z-10 min-h-screen w-full">
        {children}
      </div>
    </>
  );
}
