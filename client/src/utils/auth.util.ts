// src/utils/auth.ts
import { jwtDecode } from "jwt-decode";

/**
 * Custom interface if you have extra data in your token.
 * We extend the standard JwtPayload which already includes 'exp'.
 */
// interface CustomJwtPayload extends JwtPayload {
//   // Add any custom fields you included in your Django generate_token here
//   // e.g., user_id?: number;
// }

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    // We tell jwtDecode to expect our CustomJwtPayload
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now(); // More idiomatic than +new Date()

    // 1. Check if token exists
    // 2. Check if exp exists (decodedToken.exp is in seconds)
    // 3. Compare with current time (converted to milliseconds)
    if (
      !decodedToken ||
      !decodedToken.exp ||
      currentTime > decodedToken.exp * 1000
    ) {
      localStorage.removeItem("token");
      return false;
    }

    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: unknown) {
    // If the token is malformed or signature is invalid,
    // we clear it to ensure the user isn't stuck in a "broken" logged-in state.
    localStorage.removeItem("token");
    return false;
  }
};
