import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  clearError,
  login,
  register,
  resendVerification,
} from "@/features/authSlice";
import { Navigate, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getFirebaseAuthErrorMessage } from "@/firebase/firebaseErrors";
import { toast } from "sonner";
import { RequestStatus } from "@/features/types";
import { FolderKanban, Loader2 } from "lucide-react";

type AuthMode = "login" | "register";

const AuthPage: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);
  const loading = status === RequestStatus.LOADING;
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isEmailNotVerified = error === "auth/email-not-verified";

  useEffect(() => {
    if (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    }
  }, [error]);

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const toggleMode = () => {
    setFormData({ name: "", email: "", password: "" });
    dispatch(clearError());
    navigate(mode === "login" ? "/register" : "/login");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name !== "name" && name !== "email" && name !== "password") return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResendVerification = async () => {
    try {
      await dispatch(
        resendVerification({
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to resend verification email.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "login") {
        await dispatch(
          login({ email: formData.email, password: formData.password })
        ).unwrap();
        setFormData({ name: "", email: "", password: "" });
        navigate("/dashboard");
      } else {
        await dispatch(
          register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          })
        ).unwrap();
        setFormData({ name: "", email: "", password: "" });
        toast.success(
          "Account created! Please check your email to verify before signing in."
        );
        navigate("/login");
      }
    } catch {
      // Error handled via Redux → useEffect → toast
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-muted/40">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]" />

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <FolderKanban className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            TeamFlow
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <div className="space-y-1.5 mb-6">
            <h1 className="text-xl font-semibold text-foreground">
              {mode === "login"
                ? "Sign in to your account"
                : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Welcome back — enter your details below"
                : "Get started with TeamFlow for free"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                  placeholder="John Doe"
                  className="h-10"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearError());
                      navigate("/forgot-password");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                required
                onChange={handleInputChange}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                minLength={6}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>

            {isEmailNotVerified && mode === "login" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full"
              >
                Resend Verification Email
              </Button>
            )}
          </form>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1.5 font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © {new Date().getFullYear()} TeamFlow · Project Management
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
