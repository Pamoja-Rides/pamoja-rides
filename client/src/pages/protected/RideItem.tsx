import {
  Avatar,
  Badge,
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
import React from "react";
import { LuChevronRight, LuClock, LuPhone, LuUsers } from "react-icons/lu";
import { PiChatsCircle } from "react-icons/pi";
import type { Ride } from "@/context/ride-context";
import { useRide } from "@/context/ride-context";
import { useNavigate } from "react-router";

interface RideCardProps {
  ride: Ride;
  /** When true, renders "Posted by you" badge — used in the Posted tab */
  isOwnRide?: boolean;
  onClick?: () => void;
}

export const RideItem = ({
  ride,
  isOwnRide = false,
  onClick,
}: RideCardProps) => {
  const { isRideBooked } = useRide();
  const isBooked = isRideBooked(ride.id);
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

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = ride.driver.phone_number?.replace(/\D/g, "");
    if (phone) window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ride.driver.phone_number)
      window.location.href = `tel:${ride.driver.phone_number}`;
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
      cursor="pointer"
      transition="all 0.15s ease"
      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
      mb={5}
      onClick={onClick}
    >
      {/* Route */}
      <Flex px={5} pt={5} pb={4} justify="space-between" align="stretch">
        {/* <Flex gap={3} flex={1} align="stretch">
          <VStack gap={0} py="2px" align="center" flexShrink={0}>
            <Box w="10px" h="10px" bg="blue.500" borderRadius="full" />
            {ride.stops?.length > 0
              ? ride.stops.map((stop) => (
                  <React.Fragment key={stop.id}>
                    <Box
                      w="1.5px"
                      bg={{ _light: "gray.200", _dark: "gray.700" }}
                      minH="20px"
                      my="3px"
                    />
                    <Box
                      w="7px"
                      h="7px"
                      borderRadius="full"
                      borderWidth={1.5}
                      borderColor="blue.300"
                      bg="bg.panel"
                    />
                  </React.Fragment>
                ))
              : null}
            <Box
              w="1.5px"
              bg={{ _light: "gray.200", _dark: "gray.700" }}
              flex={1}
              my="3px"
              minH="20px"
            />
            <Box w="11px" h="11px" bg="orange.500" borderRadius="full" />
          </VStack>

          <VStack align="start" gap={3} flex={1}>
            <Box>
              <Text fontSize="xs" fontWeight="500" color="gray.400" mb="2px">
                From
              </Text>
              <Text fontSize="md" fontWeight="700">
                {ride.origin}
              </Text>
            </Box>
            {ride.stops?.map((stop) => (
              <Box key={stop.id}>
                <Text fontSize="xs" fontWeight="500" color="blue.400" mb="2px">
                  Stop
                </Text>
                <Text fontSize="sm" fontWeight="600" color="fg.muted">
                  {stop.name}
                </Text>
              </Box>
            ))}
            <Box>
              <Text fontSize="xs" fontWeight="500" color="gray.400" mb="2px">
                To
              </Text>
              <Text fontSize="md" fontWeight="700">
                {ride.destination}
              </Text>
            </Box>
          </VStack>
        </Flex> */}

        <Flex gap="4" align="stretch">
          <VStack gap="0" align="center" py="1.5">
            <Box w="10px" h="10px" bg="blue.500" borderRadius="full" />
            <Box flex="1" w="1.5px" bg="bg.emphasized" my="1" minH="20px" />
            {ride.stops.map((stop) => (
              <React.Fragment key={stop.id}>
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  borderWidth={1}
                  borderColor="fg"
                />
                <Box flex="1" w="1.5px" bg="bg.emphasized" my="1" minH="20px" />
              </React.Fragment>
            ))}
            <Box w="12px" h="12px" bg="#FF5722" borderRadius="full" />
          </VStack>

          <VStack align="start" gap="4" flex={1}>
            <Box>
              <Text textAlign="start" fontSize="xs" color="fg.subtle">
                From
              </Text>
              <Text textAlign="start" fontWeight="bold" textStyle="sm">
                {ride.origin}
              </Text>
            </Box>
            {ride.stops.map((stop) => (
              <Box key={stop.id}>
                <Text textAlign="start" fontSize="xs" color="fg.subtle">
                  Stop
                </Text>
                <Text
                  textAlign="start"
                  fontWeight="semibold"
                  textStyle="sm"
                  color="fg.muted"
                >
                  {stop.name}
                </Text>
              </Box>
            ))}
            <Box>
              <Text textAlign="start" fontSize="xs" color="whiteAlpha.700">
                To
              </Text>
              <Text textAlign="start" fontWeight="bold" textStyle="sm">
                {ride.destination}
              </Text>
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

      {/* Date + seats */}
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

      {/* Bottom section */}
      {isOwnRide ? (
        // Posted by the logged-in user
        <Flex px={5} py={4} align="center" justify="space-between">
          <Badge
            colorPalette="blue"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1}
          >
            Posted by you
          </Badge>
          <Button
            variant="plain"
            colorPalette="blue"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/rides/${ride.id}`);
            }}
          >
            Manage <LuChevronRight />
          </Button>
        </Flex>
      ) : isBooked ? (
        // Booked — show driver contact
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
              colorPalette={"blue"}
              variant="surface"
              onClick={handleCall}
            >
              <LuPhone />
            </IconButton>
            <IconButton
              aria-label="WhatsApp driver"
              size="sm"
              borderRadius="full"
              colorPalette={"blue"}
              variant="surface"
              onClick={handleWhatsApp}
            >
              <PiChatsCircle />
            </IconButton>
          </HStack>
        </Flex>
      ) : (
        // Not booked yet — show avatar + View More
        <Flex px={5} py={4} align="center" justify="space-between">
          <Avatar.Root size="lg" bg="blue.600">
            <Avatar.Fallback color="white" fontWeight="700" fontSize="md">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>
          <Button
            variant="plain"
            colorPalette="blue"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/rides/${ride.id}`);
            }}
          >
            View More <LuChevronRight />
          </Button>
        </Flex>
      )}
    </Box>
  );
};
