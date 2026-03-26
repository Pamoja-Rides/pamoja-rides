import React from "react";
import { Route, Routes } from "react-router";
import { Signin, SplashScreen } from "@/pages";
import { Text } from "@chakra-ui/react";

const App = () => {
  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/home" element={<Text>Home page</Text>} />
    </Routes>
  );
};

export default App;
