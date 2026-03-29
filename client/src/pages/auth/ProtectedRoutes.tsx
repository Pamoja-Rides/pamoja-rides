import { isAuthenticated } from "@/utils/auth.util";
import { Navigate } from "react-router";
import { ProtectedRouteLayout } from "../protected/ProtectedRouteLayout";

export const ProtectedRoutes = () => {
  const authenticated = isAuthenticated();
  return authenticated ? (
    <ProtectedRouteLayout />
  ) : (
    <Navigate to={"/signin"} replace />
  );
};
