import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { initializeAuth } from "@/features/authSlice";
import { RequestStatus } from "@/features/types";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { Navigate } from "react-router";

const AuthProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, initialized, status } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized]);

  if (!initialized || status === RequestStatus.LOADING) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthProtectedRoute;
