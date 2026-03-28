import { Provider } from "@/components/ui/provider";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "@/lang/config.ts";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const baseUrl = import.meta.env.VITE_API_URL;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Provider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>,
);
