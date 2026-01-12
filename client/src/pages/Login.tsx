

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, AlertCircle, FileSpreadsheet, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { login, isLoggingIn, loginError } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Load saved email if remember me was checked previously
  useEffect(() => {
    const savedEmail = localStorage.getItem("llas_remember_email");
    const savedRememberMe = localStorage.getItem("llas_remember_me") === "true";

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle login errors from the hook
  useEffect(() => {
    if (loginError) {
      setError(loginError.message);
      setAttempts(prev => prev + 1);
    }
  }, [loginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    // Check for too many failed attempts


    try {
      await login({ email: email.trim(), password, rememberMe });

      // Save email to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("llas_remember_email", email.trim());
        localStorage.setItem("llas_remember_me", "true");
      } else {
        localStorage.removeItem("llas_remember_email");
        localStorage.removeItem("llas_remember_me");
      }

      // Reset attempts on successful login
      setAttempts(0);

      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back to LLAS!",
      });

      // Navigate to dashboard
      navigate("/");
    } catch (err: any) {
      // Error is handled by useEffect above
      console.error("Login failed:", err);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Please contact your administrator to reset your password.",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">LLAS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex flex-1 items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md mx-auto border-card-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in to LLAS</CardTitle>
            <CardDescription className="text-center">
              Excel-based, BIR-compliant bookkeeping for Filipino businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoggingIn}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoggingIn}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={handleForgotPassword}
                  disabled={isLoggingIn}
                >
                  Forgot password?
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {attempts > 0 && attempts < 5 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {5 - attempts} attempts remaining before temporary lockout.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoggingIn}
                data-testid="button-login-submit"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Need an account? Contact your administrator.</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">LLAccounting System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LLAS. Designed for Philippine small businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
