import React from "react";
import { Route, Routes } from "react-router";
import { Home, SplashScreen } from "@/pages";
import {
  AuthLayout,
  ProtectedRoutes,
  PublicRoutes,
  Signin,
  VerifyUser,
} from "./pages/auth";
import { Signup } from "./pages/auth/Signup";

const App = () => {
  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route element={<PublicRoutes />}>
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<VerifyUser />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  );
};

export default App;
