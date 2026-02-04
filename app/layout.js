import { Geist, Geist_Mono, Courier_Prime } from "next/font/google";
import "./globals.css";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import AuthProvider from "@/components/AuthProvider";
import ToastProvider from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "ScriptForge - Smart Script Writing Assistant",
  description: "AI-powered intelligent writing assistant for maintaining narrative continuity, tracking characters, timelines, and plot threads in screenplays and long-form stories",
};

export default function RootLayout({ children }) {
  // Render without server-derived class, and let the pre-hydration script
  // set the correct theme class. suppressHydrationWarning avoids mismatches.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set initial theme early to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var s = localStorage.getItem('theme');
                  var d = s ? s === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.toggle('dark', d);
                } catch(e) {}
              })();
            `
          }}
        />
        {/* Favicon and meta */}
        <link rel="icon" href="/chain-forecast.svg" />
        <link rel="apple-touch-icon" href="/chain-forecast.svg" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${courierPrime.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider />
          <BackgroundWrapper>
            {children}
          </BackgroundWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
