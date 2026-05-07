import {
  Badge,
  Box,
  Button,
  Center,
  Drawer,
  Flex,
  HStack,
  Icon,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext } from "react";
import { useNavigate } from "react-router";
import {
  LuBellOff,
  LuCalendarCheck,
  LuCar,
  LuCheckCheck,
  LuPencil,
  LuTicket,
  LuX,
} from "react-icons/lu";
import {
  NotificationContext,
  type AppNotification,
} from "@/context/notification-context";

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; color: string; palette: string }
> = {
  ride_booked: { icon: <LuTicket />, color: "#2563EB", palette: "blue" },
  booking_confirmed: {
    icon: <LuCalendarCheck />,
    color: "#16A34A",
    palette: "green",
  },
  ride_full: { icon: <LuCar />, color: "#D97706", palette: "orange" },
  ride_edited: { icon: <LuPencil />, color: "#7C3AED", palette: "purple" },
  ride_cancelled: { icon: <LuX />, color: "#DC2626", palette: "red" },
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const NotificationDrawer = () => {
  const ctx = useContext(NotificationContext);
  const navigate = useNavigate();

  if (!ctx) return null;
  const {
    notifications,
    unreadCount,
    isOpen,
    closeDrawer,
    markAllRead,
    markOneRead,
  } = ctx;

  const handleTap = (n: AppNotification) => {
    if (!n.is_read) markOneRead(n.id);
    if (n.ride_id) {
      closeDrawer();
      navigate(`/rides/${n.ride_id}`);
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      placement="top"
      onOpenChange={(e) => !e.open && closeDrawer()}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content borderBottomRadius="2xl" maxH="85vh">
            <Drawer.Header>
              <HStack w="full" justify="space-between">
                <HStack gap={2}>
                  <Drawer.Title>Notifications</Drawer.Title>
                  {unreadCount > 0 && (
                    <Badge
                      colorPalette="red"
                      variant="solid"
                      borderRadius="full"
                      px={2}
                      fontSize="xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </HStack>
                {unreadCount > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="blue"
                    onClick={markAllRead}
                    gap={1}
                  >
                    <LuCheckCheck size={14} />
                    Mark all read
                  </Button>
                )}
              </HStack>
            </Drawer.Header>

            <Drawer.Body overflowY="auto" px={4} pb={8}>
              {notifications.length === 0 ? (
                <Center py={12}>
                  <VStack gap={3}>
                    <Icon color="fg.muted" boxSize={10}>
                      <LuBellOff />
                    </Icon>
                    <Text color="fg.muted" fontSize="sm">
                      No notifications yet
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <VStack gap={2} align="stretch">
                  {notifications.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.ride_booked;
                    return (
                      <Flex
                        key={n.id}
                        gap={3}
                        p={4}
                        borderRadius="xl"
                        bg={n.is_read ? "bg.panel" : "blue.50"}
                        _dark={{ bg: n.is_read ? "bg.panel" : "blue.950" }}
                        cursor={n.ride_id ? "pointer" : "default"}
                        borderWidth={n.is_read ? 0 : 1}
                        borderColor={{ _light: "blue.200", _dark: "blue.800" }}
                        transition="all 0.1s ease"
                        _hover={
                          n.ride_id
                            ? { shadow: "sm", transform: "translateY(-1px)" }
                            : {}
                        }
                        onClick={() => handleTap(n)}
                        align="flex-start"
                      >
                        {/* Icon circle */}
                        <Center
                          w="42px"
                          h="42px"
                          borderRadius="full"
                          bg={`${meta.palette}.50`}
                          color={meta.color}
                          flexShrink={0}
                          _dark={{ bg: `${meta.palette}.950` }}
                        >
                          <Icon boxSize={5}>{meta.icon}</Icon>
                        </Center>

                        {/* Content */}
                        <VStack align="start" gap={0.5} flex={1}>
                          <HStack justify="space-between" w="full">
                            <Text
                              fontSize="sm"
                              fontWeight={n.is_read ? "500" : "700"}
                              color={n.is_read ? "fg" : "fg"}
                              flex={1}
                            >
                              {n.title}
                            </Text>
                            {!n.is_read && (
                              <Box
                                w="8px"
                                h="8px"
                                borderRadius="full"
                                bg="blue.500"
                                flexShrink={0}
                              />
                            )}
                          </HStack>
                          <Text fontSize="xs" color="fg.muted">
                            {n.body}
                          </Text>
                          <Text fontSize="2xs" color="fg.subtle" mt={1}>
                            {timeAgo(n.created_at)}
                          </Text>
                        </VStack>
                      </Flex>
                    );
                  })}
                </VStack>
              )}
            </Drawer.Body>
            <Center pb="3" pt="1">
              <Box w="40px" h="4px" bg="gray.300" borderRadius="full" />
            </Center>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
