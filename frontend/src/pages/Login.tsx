import { useState, useEffect } from "react";
import { Shield, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, sendMagicLink, continueAsGuest } = useAuth();
  const { signUp, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signupCooldown, setSignupCooldown] = useState<number>(0);

  const isValidEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  // Ensure fields are clear on mount so browser autofill doesn't show previous credentials
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        await signIn(email, password);
        toast({ title: "Signed in", description: "Welcome back" });
        navigate("/dashboard");
      } catch (err: any) {
        console.error("Sign in failed", err);
        const msg = err?.message || String(err || "Unknown error");
        if (msg.toLowerCase().includes("invalid login") || msg.toLowerCase().includes("invalid login credentials")) {
          toast({ title: "Invalid credentials", description: "Email or password is incorrect. Try again or sign up." });
        } else if (msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("confirm your email")) {
          toast({ title: "Email not confirmed", description: "Please confirm your email address (check spam). You can also use 'Send Magic Link'." });
        } else {
          toast({ title: "Sign in failed", description: msg });
        }
      }
    })();
  };

  const handleMagicLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (!email) {
        toast({ title: "Missing email", description: "Enter your email to receive a magic link." });
        return;
      }
      await sendMagicLink(email);
      toast({ title: "Magic link sent", description: "Check your email to sign in." });
    } catch (err: any) {
      console.error("Magic link failed", err);
      toast({ title: "Failed", description: err?.message || String(err) });
    }
  };

  const handleGuest = (e: React.MouseEvent) => {
    e.preventDefault();
    continueAsGuest();
    toast({ title: "Guest mode", description: "You are now in guest mode (limited)" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to SafeWalk</h1>
          <p className="text-muted-foreground">Sign in to continue your journey</p>
        </div>

        {/* Login Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  name="email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  name="password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full gradient-primary" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={handleMagicLink} className="flex-1">
              Send Magic Link
            </Button>
            <Button variant="ghost" onClick={handleGuest} className="flex-1">
              Continue as guest
            </Button>
          </div>

          <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    if (signupCooldown > 0) {
                      toast({ title: "Please wait", description: `Please wait ${signupCooldown}s before retrying signup.` });
                      return;
                    }
                    if (!email || !password) {
                      toast({ title: "Missing fields", description: "Enter email and password to sign up." });
                      return;
                    }
                    if (!isValidEmail(email)) {
                      toast({ title: "Invalid email", description: "Please enter a valid email address." });
                      return;
                    }
                    if (password.length < 6) {
                      toast({ title: "Weak password", description: "Password must be at least 6 characters." });
                      return;
                    }

                    await signUp(email, password);
                    toast({ title: "Sign up initiated", description: "Check your email to confirm your account (if required)." });
                  } catch (err: any) {
                    console.error("Sign up failed", err);
                    const msg = err?.message || String(err || "Unknown error");
                    // Supabase sometimes returns rate-limit messages (429) telling you to wait
                    const m = msg.match(/after (\d+) seconds/i);
                    if (m && m[1]) {
                      const secs = parseInt(m[1], 10);
                      setSignupCooldown(secs);
                      toast({ title: "Rate limited", description: `Please wait ${secs}s before retrying.` });
                      // countdown
                      const iv = setInterval(() => {
                        setSignupCooldown((s) => {
                          if (s <= 1) {
                            clearInterval(iv);
                            return 0;
                          }
                          return s - 1;
                        });
                      }, 1000);
                      return;
                    }

                    if (msg.toLowerCase().includes("email address") && msg.toLowerCase().includes("invalid")) {
                      toast({ title: "Invalid email", description: "Please enter a valid email address." });
                      return;
                    }

                    toast({ title: "Sign up failed", description: msg });
                  }
                }}
                disabled={signupCooldown > 0}
                className="text-primary font-medium hover:underline"
              >
                {signupCooldown > 0 ? `Sign up (${signupCooldown}s)` : "Sign up"}
              </button>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
