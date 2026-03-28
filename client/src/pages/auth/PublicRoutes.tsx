// pages/auth/PublicRoutes.tsx
import { isAuthenticated } from "@/utils/auth.util";
import { Navigate, Outlet } from "react-router";

export const PublicRoutes = () => {
  const authenticated = isAuthenticated();
  return authenticated ? <Navigate to="/" replace /> : <Outlet />;
};
