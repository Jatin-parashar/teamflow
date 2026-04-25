import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  clearError,
  login,
  register,
  resendVerification,
} from "@/features/authSlice";
import { Navigate, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import Img1 from "@/assets/img1.jpg";
import Img2 from "@/assets/img2.jpg";
import Img3 from "@/assets/img3.jpg";
import { getFirebaseAuthErrorMessage } from "@/firebase/firebaseErrors";
import { toast } from "sonner";
import { RequestStatus } from "@/features/types";

import type { EmblaCarouselType } from "embla-carousel";

type AuthMode = "login" | "register";

const AuthPage: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [api, setApi] = useState<EmblaCarouselType | undefined>(undefined);

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

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 2000);

    return () => clearInterval(interval);
  }, [api]);

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const carouselImages = [
    {
      src: Img1,
      title: "Streamline Your Workflow",
      description:
        "Organize tasks, track progress, and collaborate seamlessly with your team.",
    },
    {
      src: Img2,
      title: "Boost Team Productivity",
      description:
        "Manage projects efficiently with intuitive tools and real-time updates.",
    },
    {
      src: Img3,
      title: "Achieve Your Goals",
      description:
        "Turn your vision into reality with powerful project management features.",
    },
  ];

  const toggleMode = () => {
    setFormData({ name: "", email: "", password: "" });
    dispatch(clearError());
    navigate(mode === "login" ? "/register" : "/login");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name !== "name" && name !== "email" && name !== "password") return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      // Error is handled by the error useEffect via Redux state
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-200 to-slate-300 flex items-center justify-center p-5">
      <div className="w-full max-w-7xl bg-white rounded-md shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[650px]">
          <div className="lg:w-1/2 relative bg-gradient-to-br from-slate-300 via-slate-300 to-slate-400 p-8 flex items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-slate-700 mb-2">
                  TeamFlow
                </h1>
                <p className="text-slate-600">Project Management Made Simple</p>
              </div>
              <Carousel
                setApi={setApi}
                className="w-full"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent>
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="text-center space-y-6">
                        <div className="relative">
                          <img
                            src={image.src}
                            alt={image.title}
                            className="w-full h-80 object-cover rounded-2xl shadow-xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl"></div>
                        </div>
                        <div className="text-white space-y-4">
                          <h3 className="text-2xl font-bold">{image.title}</h3>
                          <p className="text-slate-50 text-lg leading-relaxed">
                            {image.description}
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>

          <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
            <form className="w-full max-w-md space-y-8" onSubmit={handleSubmit}>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-700">
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-600">
                  {mode === "login"
                    ? "Sign in to your TeamFlow account"
                    : "Join TeamFlow and start managing projects"}
                </p>
              </div>

              <div className="space-y-6">
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-slate-800 font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="off"
                      className="h-12 text-black bg-slate-50 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-lg transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-800 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    className="h-12 text-black bg-slate-50 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-lg transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-slate-800 font-medium"
                    >
                      Password
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(clearError());
                          navigate("/forgot-password");
                        }}
                        className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
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
                    autoComplete="new-password"
                    className="h-12 text-black bg-slate-50 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-lg transition-all duration-200"
                    placeholder="Enter your password"
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full h-12 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>
                        {mode === "login"
                          ? "Signing in..."
                          : "Creating account..."}
                      </span>
                    </div>
                  ) : mode === "login" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {isEmailNotVerified && mode === "login" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="cursor-pointer w-full h-10 rounded-lg"
                  >
                    Resend Verification Email
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  {mode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="cursor-pointer ml-2 text-slate-600 hover:text-slate-700 font-semibold"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
