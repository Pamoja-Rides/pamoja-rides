import { isAuthenticated } from "@/utils/auth.util";
import React from "react";
import { Navigate, Outlet } from "react-router";

export const ProtectedRoutes = () => {
  const authenticated = isAuthenticated();
  return authenticated ? <Outlet /> : <Navigate to={"/signin"} replace />;
};
