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
import { Home, PostRide, ProfilePage, Rides, Search } from "./pages/protected";
import { RideProvider } from "./context/RideContextProvider";
import { RideDetailsPage } from "./components/common";

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
      <Route
        element={
          <RideProvider>
            <ProtectedRoutes />
          </RideProvider>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path={"/search"} element={<Search />} />
        <Route path={"/post"} element={<PostRide />} />
        <Route path={"/rides"} element={<Rides />} />
        <Route path={"/profile"} element={<ProfilePage />} />
        <Route path="/rides/:rideId" element={<RideDetailsPage />} />
      </Route>
    </Routes>
  );
};

export default App;
