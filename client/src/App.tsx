import { Route, Routes } from "react-router";
import { SplashScreen } from "@/pages";
import {
  AuthLayout,
  ProtectedRoutes,
  PublicRoutes,
  Signin,
  VerifyUser,
} from "./pages/auth";
import { Signup } from "./pages/auth/Signup";
import { Home } from "./pages/protected";

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
        <Route path={"/search"} element={<h1>Search Page</h1>} />
        <Route path={"/post"} element={<h1>Post Page</h1>} />
        <Route path={"/rides"} element={<h1>My rides Page</h1>} />
      </Route>
    </Routes>
  );
};

export default App;
