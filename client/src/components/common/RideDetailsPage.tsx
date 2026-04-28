import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Drawer,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Portal,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import {
  LuArrowLeft,
  LuCalendar,
  LuCar,
  LuClock,
  LuMessageCircle,
  LuPhone,
  LuUsers,
} from "react-icons/lu";
import { RideContext, type RideStop } from "@/context/ride-context";
import { getCurrentUserId } from "@/utils/auth.util";
import axios from "axios";
import { baseUrl } from "@/main";

interface Passenger {
  booking_id: string;
  seats_booked: number;
  booked_at: string;
  passenger: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    is_verified: boolean;
  };
}

export const RideDetailsPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const rideContext = useContext(RideContext);

  const rides = rideContext?.rides ?? [];
  const sendWSMessage = rideContext?.sendWSMessage;
  const isRideBooked = rideContext?.isRideBooked;
  const bookRide = rideContext?.bookRide;

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);

  const ride =
    rides.find((r) => r.id === rideId) ?? rideContext?.singleRide ?? null;

  const currentUserId = getCurrentUserId();
  const isDriver = ride ? ride.driver.id === currentUserId : false;
  const isBooked = isRideBooked?.(ride?.id ?? "") ?? false;

  useEffect(() => {
    if (!ride && rideId && sendWSMessage) {
      sendWSMessage("fetch_one", { ride_id: rideId });
    }
  }, [ride, rideId, sendWSMessage]);

  useEffect(() => {
    if (!isDriver || !rideId || !ride) return;

    const fetchPassengers = async () => {
      try {
        setLoadingPassengers(true);

        const res = await axios.get<Passenger[]>(
          `${baseUrl}/rides/${rideId}/passengers/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        setPassengers(res.data);
      } catch (err) {
        console.error("Failed to fetch passengers", err);
      } finally {
        setLoadingPassengers(false);
      }
    };

    fetchPassengers();
  }, [isDriver, rideId, ride]);

  if (!ride) return null;

  const stops: RideStop[] = ride.stops ?? [];
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
    if (ride.driver.phone_number)
      window.location.href = `tel:${ride.driver.phone_number}`;
  };
  const handleWhatsApp = () => {
    const phone = ride.driver.phone_number?.replace(/\D/g, "");
    if (phone) window.open(`https://wa.me/${phone}`, "_blank");
  };

  const mapSrc =
    ride.pickup_lat && ride.pickup_lng
      ? `https://www.google.com/maps?q=${ride.pickup_lat},${ride.pickup_lng}&z=15&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(ride.pickup_point)}&z=15&output=embed`;

  return (
    <Box position="relative" rowGap={10} minH="100vh">
      {/* Header */}
      <Box
        bgGradient="to-r"
        gradientFrom="blue.600"
        gradientTo="blue.500"
        color="white"
        pt="3rem"
        pb={20}
      >
        <Container maxW="container.md">
          <Flex mb={10}>
            <IconButton
              borderRadius="full"
              bg="blue.500"
              onClick={() => navigate(-1)}
            >
              <LuArrowLeft />
            </IconButton>
          </Flex>

          <Flex gap="4" align="stretch">
            <VStack gap="0" align="center" py="1.5">
              <Box w="10px" h="10px" bg="white" borderRadius="full" />
              <Box flex="1" w="1.5px" bg="whiteAlpha.600" my="1" minH="20px" />
              {stops.map((stop) => (
                <React.Fragment key={stop.id}>
                  <Box
                    w="8px"
                    h="8px"
                    bg="whiteAlpha.800"
                    borderRadius="full"
                    borderWidth={1}
                    borderColor="white"
                  />
                  <Box
                    flex="1"
                    w="1.5px"
                    bg="whiteAlpha.600"
                    my="1"
                    minH="20px"
                  />
                </React.Fragment>
              ))}
              <Box w="12px" h="12px" bg="#FF5722" borderRadius="full" />
            </VStack>

            <VStack align="start" gap="4" flex={1}>
              <Box>
                <Text textAlign="start" fontSize="xs" color="whiteAlpha.700">
                  From
                </Text>
                <Text textAlign="start" fontWeight="bold" textStyle="sm">
                  {ride.origin}
                </Text>
              </Box>
              {stops.map((stop) => (
                <Box key={stop.id}>
                  <Text textAlign="start" fontSize="xs" color="whiteAlpha.600">
                    Stop
                  </Text>
                  <Text
                    textAlign="start"
                    fontWeight="semibold"
                    textStyle="sm"
                    color="whiteAlpha.900"
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
        </Container>
      </Box>

      <Container maxW="container.md" position="relative" mt={-16}>
        {/* Stats */}
        <HStack
          bg="bg.panel"
          borderRadius="3xl"
          p={6}
          shadow="lg"
          justify="space-around"
        >
          <StatItem
            icon={<LuCalendar size={20} />}
            label="Date"
            value={dateLabel}
            iconBg={{ _light: "green.100", _dark: "green.800" }}
            iconColor="#2D9B73"
          />
          <StatItem
            icon={<LuClock size={20} />}
            label="Time"
            value={timeLabel}
            iconBg={{ _light: "blue.100", _dark: "blue.800" }}
            iconColor="#4A8BFF"
          />
          <StatItem
            icon={<LuUsers size={20} />}
            label="Seats"
            value={`${ride.available_seats} left`}
            iconBg={{ _light: "orange.100", _dark: "orange.800" }}
            iconColor="#D97706"
          />
        </HStack>

        {/* ── Driver view: show passengers ─────────────────── */}
        {isDriver ? (
          <Box bg="bg.panel" p="6" borderRadius="3xl" shadow="lg" mt={5}>
            <HStack justify="space-between" mb={5}>
              <Text fontWeight="800" fontSize="lg">
                Passengers
              </Text>
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={3}
              >
                {passengers.length} booked
              </Badge>
            </HStack>

            {loadingPassengers ? (
              <Center py={8}>
                <Spinner color="blue.500" />
              </Center>
            ) : passengers.length === 0 ? (
              <Center py={8}>
                <VStack gap={2}>
                  <Icon color="fg.muted" boxSize={8}>
                    <LuUsers />
                  </Icon>
                  <Text color="fg.muted" fontSize="sm">
                    No passengers yet
                  </Text>
                </VStack>
              </Center>
            ) : (
              <VStack gap={0}>
                {passengers.map((booking, index) => (
                  <React.Fragment key={booking.booking_id}>
                    <Flex w="full" align="center" gap={4} py={4}>
                      <Avatar.Root size="md" bg="blue.600">
                        <Avatar.Fallback color="white" fontWeight="700">
                          {`${booking.passenger.first_name[0]}${booking.passenger.last_name[0]}`.toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <VStack align="start" gap={0} flex={1}>
                        <HStack gap={2}>
                          <Text fontWeight="700" fontSize="md">
                            {booking.passenger.first_name}{" "}
                            {booking.passenger.last_name}
                          </Text>
                          {booking.passenger.is_verified && (
                            <Badge
                              colorPalette="green"
                              variant="subtle"
                              size="sm"
                            >
                              Verified
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="fg.muted">
                          {booking.passenger.phone_number}
                        </Text>
                        <Text fontSize="xs" color="fg.subtle">
                          {booking.seats_booked} seat
                          {booking.seats_booked !== 1 ? "s" : ""} ·{" "}
                          {new Date(booking.booked_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </Text>
                      </VStack>
                      <HStack gap={2}>
                        <IconButton
                          aria-label="Call passenger"
                          size="sm"
                          borderRadius="full"
                          colorPalette="blue"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `tel:${booking.passenger.phone_number}`;
                          }}
                        >
                          <LuPhone />
                        </IconButton>
                        <IconButton
                          aria-label="WhatsApp passenger"
                          size="sm"
                          borderRadius="full"
                          colorPalette="blue"
                          variant="outline"
                          onClick={() => {
                            const phone =
                              booking.passenger.phone_number?.replace(
                                /\D/g,
                                "",
                              );
                            if (phone)
                              window.open(`https://wa.me/${phone}`, "_blank");
                          }}
                        >
                          <LuMessageCircle />
                        </IconButton>
                      </HStack>
                    </Flex>
                    {index < passengers.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </VStack>
            )}

            <Separator mt={4} mb={4} />
            <HStack gap={2} color="fg.muted">
              <Icon boxSize={4}>
                <LuCar />
              </Icon>
              <Text fontSize="sm">
                {ride.car_model} · {ride.license_plate}
              </Text>
            </HStack>
            <HStack gap={2} color="fg.muted" mt={2}>
              <Text fontSize="sm">Pickup:</Text>
              <Link
                color="blue.500"
                cursor="pointer"
                fontSize="sm"
                onClick={() => setIsMapOpen(true)}
              >
                {ride.pickup_point} — View on map
              </Link>
            </HStack>
          </Box>
        ) : (
          // ── Passenger view: driver info + book button ──────
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
                <Text color="gray.500">Pickup Point</Text>
                <Text>{ride.pickup_point}</Text>
                <HStack gap="2">
                  <Link
                    color="#0066CC"
                    cursor="pointer"
                    onClick={() => setIsMapOpen(true)}
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
                onClick={() => bookRide?.(ride.id, 1)}
              >
                Book this ride
              </Button>
            )}
          </Box>
        )}
      </Container>

      {/* Map drawer */}
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
                    allowFullScreen
                    src={mapSrc}
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
  iconBg: string | { _light: string; _dark: string };
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
