import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuChevronRight, LuClock, LuPhone, LuUsers } from "react-icons/lu";
import { PiChatsCircle } from "react-icons/pi";
import type { Ride } from "@/context/ride-context";
import { useRide } from "@/context/ride-context"; // ✅ NEW
import { useNavigate } from "react-router";

interface RideCardProps {
  ride: Ride;
  onBook?: (ride: Ride) => void;
}

export const RideItem = ({ ride, onBook }: RideCardProps) => {
  const { isRideBooked } = useRide(); // ✅ NEW
  const isBooked = isRideBooked(ride.id); // ✅ NEW
  const navigate = useNavigate();

  const initials =
    `${ride.driver.first_name[0] ?? ""}${ride.driver.last_name?.[0] ?? ""}`.toUpperCase();

  const departureDate = new Date(ride.departure_datetime);
  const dateLabel = departureDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeLabel = departureDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const handleWhatsApp = () => {
    const phone = ride.driver.phone_number?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };

  const handleCall = () => {
    if (ride.driver.phone_number) {
      window.location.href = `tel:${ride.driver.phone_number}`;
    }
  };

  return (
    <Box
      bg="bg.panel"
      _dark={{ bg: "gray.900" }}
      borderRadius="2xl"
      shadow="md"
      borderWidth={0.5}
      overflow="hidden"
      w="full"
      cursor={onBook ? "pointer" : "default"}
      transition="all 0.15s ease"
      _hover={onBook ? { shadow: "md", transform: "translateY(-1px)" } : {}}
      mb={5}
    >
      {/* ── Top section */}
      <Flex px={5} pt={5} pb={4} justify="space-between" align="stretch">
        <Flex gap={3} flex={1} align="stretch">
          <VStack gap={0} py="2px" align="center" flexShrink={0}>
            <Box w="10px" h="10px" bg="blue.500" borderRadius="full" />
            <Box
              flex={1}
              w="1.5px"
              bg={{ _light: "gray.200", _dark: "gray.700" }}
              my="4px"
              minH="32px"
            />
            <Box w="11px" h="11px" bg="orange.500" borderRadius="full" />
          </VStack>

          <VStack align="start" gap={4} flex={1}>
            <Box>
              <Text fontSize="xs" fontWeight="500" color="gray.400" mb="2px">
                From
              </Text>
              <Text fontSize="md" fontWeight="700">
                {ride.origin}
              </Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="500" color="gray.400" mb="2px">
                To
              </Text>
              <Flex align="center" gap={1}>
                <Text fontSize="md" fontWeight="700">
                  {ride.destination}
                </Text>
                <Icon color="gray.400" boxSize={4}>
                  <LuChevronRight />
                </Icon>
              </Flex>
            </Box>
          </VStack>
        </Flex>

        <VStack align="end" pl={4}>
          <Text fontSize="2xl" fontWeight="800" color="blue.600">
            {ride.price_per_seat.toLocaleString()}
          </Text>
          <Text fontSize="xs" color="gray.400">
            RWF/seat
          </Text>
        </VStack>
      </Flex>

      <Separator />

      {/* ── Middle */}
      <HStack px={5} py={3} gap={5}>
        <HStack gap={1.5} color="gray.500">
          <Icon boxSize={4}>
            <LuClock />
          </Icon>
          <Text fontSize="sm">
            {dateLabel} • {timeLabel}
          </Text>
        </HStack>

        <HStack gap={1.5} color="gray.500">
          <Icon boxSize={4}>
            <LuUsers />
          </Icon>
          <Text fontSize="sm">
            {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""}
          </Text>
        </HStack>
      </HStack>

      <Separator />

      {/* ── Bottom: CONDITIONAL ONLY */}
      {isBooked ? (
        <Flex px={5} py={4} align="center" gap={3}>
          <Avatar.Root size="lg" bg="blue.600">
            <Avatar.Fallback color="white" fontWeight="700" fontSize="md">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>

          <Text fontWeight="700" fontSize="md" flex={1}>
            {ride.driver.first_name} {ride.driver.last_name}
          </Text>

          <HStack gap={2}>
            <IconButton
              aria-label="Call driver"
              size="sm"
              borderRadius="full"
              bg="blue.50"
              color="blue.600"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleCall();
              }}
            >
              <LuPhone />
            </IconButton>

            <IconButton
              aria-label="WhatsApp driver"
              size="sm"
              borderRadius="full"
              bg="blue.50"
              color="blue.600"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsApp();
              }}
            >
              <PiChatsCircle />
            </IconButton>
          </HStack>
        </Flex>
      ) : (
        <Flex
          px={5}
          py={4}
          align="center"
          columnGap={5}
          justifyContent={"space-between"}
        >
          <Avatar.Root size="lg" bg="blue.600">
            <Avatar.Fallback color="white" fontWeight="700" fontSize="md">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>
          <Button
            variant={"plain"}
            colorPalette={"blue"}
            size={"xs"}
            onClick={() => navigate(`/rides/${ride.id}`)}
          >
            View More
            <LuChevronRight />
          </Button>
        </Flex>
      )}
    </Box>
  );
};
