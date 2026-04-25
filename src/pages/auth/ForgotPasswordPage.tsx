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
import { ArrowLeft, Mail } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-200 to-slate-300 flex items-center justify-center p-5">
      <div className="w-full max-w-7xl bg-white rounded-md shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[650px]">
          {/* Branding Panel */}
          <div className="lg:w-1/2 relative bg-gradient-to-br from-slate-300 via-slate-300 to-slate-400 p-8 flex items-center justify-center">
            <div className="w-full max-w-lg text-center space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-700 mb-2">
                  TeamFlow
                </h1>
                <p className="text-slate-600">Project Management Made Simple</p>
              </div>
              <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Mail className="w-10 h-10 text-slate-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-700">
                  Check Your Email
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-sm mx-auto">
                  We'll send you a secure link to reset your password and get
                  back to managing your projects.
                </p>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-700">
                  Reset Password
                </h2>
                <p className="text-gray-600">
                  Enter your email and we'll send you a link to reset your
                  password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-800 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="h-12 text-black bg-slate-50 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-lg"
                    placeholder="Enter your email"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full h-12 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    dispatch(clearError());
                    navigate("/login");
                  }}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-700 font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
