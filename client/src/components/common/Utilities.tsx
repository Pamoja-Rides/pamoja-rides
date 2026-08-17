import { ColorModeButton } from "@/components/ui/color-mode";
import { NotificationContext } from "@/context/notification-context";
import { LanguageSelection } from "@/pages/languageSelect/LanguageSelection";
import { Box, IconButton } from "@chakra-ui/react";
import { useContext } from "react";
import { LuBell } from "react-icons/lu";
import { NotificationDrawer } from "./NotificationDrawer";

interface UtilitiesProps {
  color?: string;
}

export const Utilities = ({ color }: UtilitiesProps) => {
  const notifContext = useContext(NotificationContext);
  const unreadCount = notifContext?.unreadCount ?? 0;

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        {/* Bell */}
        <Box position="relative">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Notifications"
            color={color ?? "fg"}
            _hover={{ bg: color ? "whiteAlpha.200" : "bg.subtle" }}
            onClick={() => notifContext?.openDrawer()}
          >
            <LuBell />
          </IconButton>
          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="2px"
              right="2px"
              bg="red.500"
              color="white"
              borderRadius="full"
              minW="17px"
              h="17px"
              fontSize="10px"
              fontWeight="800"
              display="flex"
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Box>
          )}
        </Box>

        <ColorModeButton color={color} />
        <LanguageSelection />
      </Box>

      <NotificationDrawer />
    </>
  );
};
