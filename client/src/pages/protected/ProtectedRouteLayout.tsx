import { BottomTabs } from "@/components/common/BottomTabs";
import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router";

export const ProtectedRouteLayout = () => {
  return (
    <Box minH={"70vh"}>
      <Outlet />
      <BottomTabs />
    </Box>
  );
};
