import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { resetPassword, clearError } from "@/features/authSlice";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getFirebaseAuthErrorMessage } from "@/firebase/firebaseErrors";
import { RequestStatus } from "@/features/types";
import { ArrowLeft, FolderKanban, Loader2 } from "lucide-react";

const ForgotPasswordPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const status = useAppSelector((state) => state.auth.status);
  const loading = status === RequestStatus.LOADING;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(resetPassword(email)).unwrap();
      toast.success("Password reset email sent! Check your inbox.");
      navigate("/login");
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error as string));
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
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a link to get back into your
              account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-10"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                dispatch(clearError());
                navigate("/login");
              }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © {new Date().getFullYear()} TeamFlow · Project Management
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
