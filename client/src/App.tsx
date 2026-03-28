import React from "react";
import { Route, Routes } from "react-router";
import { SplashScreen } from "@/pages";
import { Text } from "@chakra-ui/react";
import { AuthLayout } from "./pages/auth/AuthLayout";
import { Signup } from "./pages/auth/Signup";
import { Signin } from "./pages/auth/Signin";
import { VerifyUser } from "./pages/auth/VerifyUser";

const App = () => {
  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route element={<AuthLayout />}>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyUser />} />
      </Route>
      <Route path="/home" element={<Text>Home page</Text>} />
    </Routes>
  );
};

export default App;
