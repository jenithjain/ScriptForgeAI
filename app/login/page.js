"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import StaggeredMenu from "@/components/StaggeredMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Lock, Eye, EyeOff, Sparkles, TrendingUp,
  Shield, Github, Chrome, Loader2
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

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

  const validateForm = () => {
    setFieldErrors({});

    try {
      if (isLogin) {
        loginSchema.parse({
          email: formData.email,
          password: formData.password,
        });
      } else {
        signupSchema.parse({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }
      return true;
    } catch (error) {
      if (error.errors) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setFieldErrors(errors);
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    const toastId = toast.loading(isLogin ? "Signing in..." : "Creating account...");

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name?.trim(),
        mode: isLogin ? "signin" : "signup",
        redirect: false
      });

      if (result?.error) {
        toast.error(result.error, { id: toastId });
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success(
          isLogin ? "Welcome back!" : "Account created successfully!",
          { id: toastId }
        );

        // Small delay for better UX
        setTimeout(() => {
          // Redirect all users to dashboard
          router.push("/dashboard");
          router.refresh();
        }, 500);
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("An unexpected error occurred. Please try again.", { id: toastId });
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Redirecting to Google...");

    try {
      // Pass a custom callbackUrl that we'll handle in the callback
      await signIn("google", {
        callbackUrl: "/dashboard" // Default to onboarding, will be redirected if KYC complete
      });
    } catch (err) {
      console.error("Google auth error:", err);
      toast.error("Failed to sign in with Google. Please try again.", { id: toastId });
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: undefined
      });
    }
  };

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
              { label: "Login", link: "/login", ariaLabel: "Login to your account" },
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

        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left Side - Branding */}
          <div className="hidden md:block space-y-6">
            <div className="space-y-4">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                Smart Script Writing Assistant
              </Badge>
              <h1 className="text-5xl font-bold text-foreground ivy-font">
                Welcome to
                <span className="block mt-2 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  ScriptForge
                </span>
              </h1>
              <p className="text-lg text-muted-foreground ivy-font max-w-md">
                Your intelligent writing companion for maintaining perfect narrative continuity across screenplays and long-form stories.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3 mt-8">
              {[
                { icon: TrendingUp, title: "Story Intelligence", desc: "Track characters, timelines, and plot threads" },
                { icon: Shield, title: "Continuity Protection", desc: "Detect inconsistencies before they become problems" },
                { icon: Sparkles, title: "AI Creative Support", desc: "Intelligent suggestions that match your style" }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground ivy-font">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground ivy-font">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Form */}
          <Card className="border-border/40 backdrop-blur-xl bg-card/80 shadow-2xl">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl ivy-font">
                {isLogin ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription className="ivy-font">
                {isLogin
                  ? "Sign in to access your writing projects and story analytics"
                  : "Create an account to start writing with AI assistance"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field - only for signup */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="ivy-font">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      required={!isLogin}
                      className={`ivy-font ${fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-500">{fieldErrors.name}</p>
                    )}
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="ivy-font">
                    Email {!isLogin && <span className="text-muted-foreground text-xs">(Use your business email)</span>}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@yourcompany.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-10 ivy-font ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="ivy-font">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-10 pr-10 ivy-font ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500">{fieldErrors.password}</p>
                  )}

                  {/* Password strength indicator - only show during signup */}
                  {!isLogin && formData.password && (
                    <PasswordStrengthIndicator password={formData.password} />
                  )}
                </div>

                {/* Confirm Password - only for signup */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="ivy-font">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`pl-10 ivy-font ${fieldErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        required={!isLogin}
                      />
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {/* TODO: Add forgot password page before re-enabling this link */}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white ivy-font"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    isLogin ? "Sign In" : "Create Account"
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <Separator />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground ivy-font">
                    Or continue with
                  </span>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="ivy-font w-full"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                </div>

                {/* Toggle Login/Signup */}
                <p className="text-center text-sm text-muted-foreground ivy-font mt-6">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFieldErrors({});
                      setFormData({ email: "", password: "", confirmPassword: "", name: "" });
                    }}
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                    disabled={isLoading}
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
