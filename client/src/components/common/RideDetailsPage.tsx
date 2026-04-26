import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  Stack,
  Text,
  VStack,
  Drawer,
  Portal,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuCalendar,
  LuCar,
  LuClock,
  LuMessageCircle,
  LuPhone,
  LuUsers,
} from "react-icons/lu";
import { useParams } from "react-router";
import { useRide } from "@/context/ride-context";

export const RideDetailsPage = () => {
  const { rideId } = useParams();
  const { rides, sendWSMessage, isRideBooked, bookRide } = useRide();

  const [isMapOpen, setIsMapOpen] = useState(false);

  const ride = rides.find((r) => r.id === rideId);

  useEffect(() => {
    if (!ride && rideId) {
      sendWSMessage("fetch_one", { ride_id: rideId });
    }
  }, [ride, rideId, sendWSMessage]);

  if (!ride) return null;

  const isBooked = isRideBooked(ride.id);

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

  const initials =
    `${ride.driver.first_name[0] ?? ""}${ride.driver.last_name?.[0] ?? ""}`.toUpperCase();

  const handleCall = () => {
    if (ride.driver.phone_number) {
      window.location.href = `tel:${ride.driver.phone_number}`;
    }
  };

  const handleWhatsApp = () => {
    const phone = ride.driver.phone_number?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };

  return (
    <Box position={"relative"} rowGap={10} h={"90vh"}>
      {/* HEADER */}
      <Box
        bgGradient="to-r"
        gradientFrom="blue.600"
        gradientTo="blue.500"
        color="white"
        pt={"3rem"}
        pb={20}
        textAlign="center"
      >
        <Container maxW="container.md">
          <Flex mb={10}>
            <IconButton borderRadius={"full"} bg={"blue.500"}>
              <LuArrowLeft />
            </IconButton>
          </Flex>

          <Flex gap="4" align="stretch">
            <VStack gap="0" py="1.5" align="center">
              <Box w="10px" h="10px" bg="white" borderRadius="full" />
              <Box flex="1" w="1.5px" bg="whiteAlpha.600" my="1" />
              <Box w="12px" h="12px" bg="#FF5722" borderRadius="full" />
            </VStack>

            <VStack align="start" gap="4">
              <Box>
                <Text textAlign={"start"} fontSize="xs" color="whiteAlpha.700">
                  From
                </Text>
                <Text textAlign={"start"} fontWeight="bold" textStyle={"sm"}>
                  {ride.origin}
                </Text>
              </Box>

              <Box>
                <Text textAlign={"start"} fontSize="xs" color="whiteAlpha.700">
                  To
                </Text>
                <Text textAlign={"start"} fontWeight="bold" textStyle={"sm"}>
                  {ride.destination}
                </Text>
              </Box>
            </VStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.md" position="relative" mt={-16}>
        {/* STATS */}
        <Stack bg="bg.panel" borderRadius="3xl" p={6} shadow="lg">
          <HStack justify="space-around">
            <StatItem
              icon={<LuCalendar size={20} />}
              label="Date"
              value={dateLabel}
              iconBg="#E6F6F1"
              iconColor="#2D9B73"
            />
            <StatItem
              icon={<LuClock size={20} />}
              label="Time"
              value={timeLabel}
              iconBg="#EBF2FF"
              iconColor="#4A8BFF"
            />
            <StatItem
              icon={<LuUsers size={20} />}
              label="Seats"
              value={`${ride.available_seats} left`}
              iconBg="#FFF8EB"
              iconColor="#D97706"
            />
          </HStack>
        </Stack>

        {/* DRIVER */}
        <Box bg="white" p="8" borderRadius="3xl" shadow="lg" mt={5}>
          <Text fontWeight="800" fontSize="lg" mb="6">
            Driver
          </Text>

          <Flex gap="5" mb="8">
            <Avatar.Root size="lg" bg="#0066CC">
              <Avatar.Fallback color="white">{initials}</Avatar.Fallback>
            </Avatar.Root>

            <VStack align="start" gap="1">
              <Text fontWeight="800" fontSize="22px">
                {ride.driver.first_name} {ride.driver.last_name}
              </Text>

              <HStack color="gray.500" gap="2">
                <LuCar size={16} />
                <Text>{ride.car_model}</Text>
              </HStack>

              <Text color="gray.500">{ride.license_plate}</Text>

              <HStack gap="2">
                <Text color="gray.500">Pickup Point</Text>
                <Link
                  color="#0066CC"
                  onClick={() => {
                    console.log("ride", ride);
                    setIsMapOpen(true);
                  }}
                >
                  View on map
                </Link>
              </HStack>
            </VStack>
          </Flex>

          {isBooked ? (
            <HStack gap="4">
              <Button
                flex="1"
                size="xl"
                bg="#E6F4F9"
                color="#0066CC"
                borderRadius="2xl"
                variant="ghost"
                onClick={handleCall}
              >
                Call <LuPhone size={18} style={{ marginLeft: "8px" }} />
              </Button>

              <Button
                flex="1"
                size="xl"
                bg="#E8F8FF"
                color="#0088CC"
                borderRadius="2xl"
                variant="ghost"
                onClick={handleWhatsApp}
              >
                Whatsapp{" "}
                <LuMessageCircle size={18} style={{ marginLeft: "8px" }} />
              </Button>
            </HStack>
          ) : (
            <Button
              w="full"
              size="xl"
              colorPalette="blue"
              borderRadius="2xl"
              onClick={() => bookRide(ride.id, 1)}
            >
              Book this ride
            </Button>
          )}
        </Box>
      </Container>

      {/* ✅ MAP DRAWER */}
      <Drawer.Root
        open={isMapOpen}
        onOpenChange={(e) => setIsMapOpen(e.open)}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content borderTopRadius="2xl" overflow="hidden">
              <Center pt="3" pb="1">
                <Box
                  width="40px"
                  height="4px"
                  bg="gray.300"
                  borderRadius="full"
                />
              </Center>
              <Drawer.Header>
                <Drawer.Title>Pickup Location</Drawer.Title>
              </Drawer.Header>

              <Drawer.Body p={0}>
                <Box w="100%" h="400px">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${ride.pickup_lat},${ride.pickup_lng}&z=15&output=embed`}
                  />
                </Box>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Box>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}

const StatItem = ({ icon, label, value, iconBg, iconColor }: StatItemProps) => (
  <VStack gap="3">
    <Center w="50px" h="50px" bg={iconBg} color={iconColor} borderRadius="2xl">
      {icon}
    </Center>
    <VStack>
      <Text fontSize="sm" color="fg.subtle" fontWeight="600">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="800">
        {value}
      </Text>
    </VStack>
  </VStack>
);
