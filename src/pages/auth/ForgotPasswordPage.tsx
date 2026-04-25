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
      <div className="w-full max-w-md bg-white rounded-md shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-700">Reset Password</h2>
          <p className="text-gray-600">
            Enter your email and we'll send you a link to reset your password.
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
            className="cursor-pointer text-slate-600 hover:text-slate-700 font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
