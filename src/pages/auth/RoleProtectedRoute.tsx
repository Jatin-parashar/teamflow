import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/features/types";
import React from "react";
import { Navigate } from "react-router";

const RoleProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Role[];
  permission?: (role: Role) => boolean;
}> = ({ children, allowedRoles, permission }) => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/unauthorized" />;

  if (permission && !permission(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default RoleProtectedRoute;
