import { BottomTabs } from "@/components/common/BottomTabs";
import { Outlet } from "react-router";

export const ProtectedRouteLayout = () => {
  return (
    <>
      <Outlet />
      <BottomTabs />
    </>
  );
};
