import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  user_id: string;
  exp: number;
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded?.exp || Date.now() > decoded.exp * 1000) {
      localStorage.removeItem("token");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token");
    return false;
  }
};

export const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.user_id ?? null;
  } catch {
    return null;
  }
};
