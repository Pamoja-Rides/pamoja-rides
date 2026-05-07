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
import {
  EditRide,
  Home,
  PostRide,
  ProfilePage,
  ProtectedRouteLayout,
  RideDetailsPage,
  Rides,
  Search,
} from "./pages/protected";
import { RideProvider } from "./context/RideContextProvider";
import { NotificationProvider } from "./context/NotificationProvider";

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
            <NotificationProvider>
              <ProtectedRoutes />
            </NotificationProvider>
          </RideProvider>
        }
      >
        <Route element={<ProtectedRouteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/post" element={<PostRide />} />
          <Route path="/rides" element={<Rides />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/rides/:rideId" element={<RideDetailsPage />} />
        <Route path="/rides/:rideId/edit" element={<EditRide />} />
      </Route>
    </Routes>
  );
};

export default App;
