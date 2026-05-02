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
  NumberInput,
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
  LuCheck,
  LuClock,
  LuLock,
  LuMessageCircle,
  LuPhone,
  LuUsers,
} from "react-icons/lu";
import { RideContext, type RideStop } from "@/context/ride-context";
import { getCurrentUserId } from "@/utils/auth.util";
import axios from "axios";
import { baseUrl } from "@/main";
import { toaster } from "@/components/ui/toaster";

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
  const refreshBookings = rideContext?.refreshBookings;

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [justBooked, setJustBooked] = useState(false);

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
    setLoadingPassengers(true);
    axios
      .get<Passenger[]>(`${baseUrl}/rides/${rideId}/passengers/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setPassengers(res.data))
      .catch(() => {})
      .finally(() => setLoadingPassengers(false));
  }, [isDriver, rideId, ride]);

  const handleConfirmBooking = async () => {
    if (!rideId || !bookRide) return;
    setIsBooking(true);
    try {
      // Use REST for booking to get proper error handling
      await axios.post(
        `${baseUrl}/rides/${rideId}/book/`,
        { seats },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      await refreshBookings?.();
      setJustBooked(true);
      setIsBookingOpen(false);
      toaster.create({
        title: "Ride booked!",
        description: `${seats} seat${seats > 1 ? "s" : ""} confirmed.`,
        type: "success",
      });
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Booking failed")
        : "Booking failed";
      toaster.create({ title: message, type: "error" });
    } finally {
      setIsBooking(false);
    }
  };

  if (!ride) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner color="blue.500" size="lg" />
      </Flex>
    );
  }

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
  const pricePerSeat = Number(ride.price_per_seat);
  const totalPrice = pricePerSeat * seats;

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
    <Box position="relative" minH="100vh">
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
              color={"white"}
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
                <Text fontSize="xs" color="whiteAlpha.700">
                  From
                </Text>
                <Text fontWeight="bold" textStyle="sm">
                  {ride.origin}
                </Text>
              </Box>
              {stops.map((stop) => (
                <Box key={stop.id}>
                  <Text fontSize="xs" color="whiteAlpha.600">
                    Stop
                  </Text>
                  <Text
                    fontWeight="semibold"
                    textStyle="sm"
                    color="whiteAlpha.900"
                  >
                    {stop.name}
                  </Text>
                </Box>
              ))}
              <Box>
                <Text fontSize="xs" color="whiteAlpha.700">
                  To
                </Text>
                <Text fontWeight="bold" textStyle="sm">
                  {ride.destination}
                </Text>
              </Box>
            </VStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.md" position="relative" mt={-16} pb={10}>
        {/* Stats */}
        <HStack
          bg="bg.panel"
          borderRadius="3xl"
          p={6}
          shadow="lg"
          justify="space-around"
          mb={4}
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

        {/* Driver view: passengers */}
        {isDriver ? (
          <Box bg="bg.panel" p="6" borderRadius="3xl" shadow="lg">
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
                            { month: "short", day: "numeric" },
                          )}
                        </Text>
                      </VStack>
                      <HStack gap={2}>
                        <IconButton
                          aria-label="Call"
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
                          aria-label="WhatsApp"
                          size="sm"
                          borderRadius="full"
                          colorPalette="blue"
                          variant="outline"
                          onClick={() => {
                            const p = booking.passenger.phone_number?.replace(
                              /\D/g,
                              "",
                            );
                            if (p) window.open(`https://wa.me/${p}`, "_blank");
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
          // Passenger view
          <Box bg="bg.panel" p="6" borderRadius="3xl" shadow="lg">
            <Text fontWeight="800" fontSize="lg" mb="5">
              Driver
            </Text>
            <Flex gap="4" mb="6">
              <Avatar.Root size="lg" bg="blue.600">
                <Avatar.Fallback color="white" fontWeight="700">
                  {initials}
                </Avatar.Fallback>
              </Avatar.Root>
              <VStack align="start" gap="1" flex={1}>
                <Text fontWeight="800" fontSize="xl">
                  {ride.driver.first_name} {ride.driver.last_name}
                </Text>
                <HStack color="gray.500" gap="2">
                  <LuCar size={15} />
                  <Text fontSize="sm">
                    {ride.car_model} · {ride.license_plate}
                  </Text>
                </HStack>
              </VStack>
              {/* Price badge */}
              <VStack align="end" gap={0}>
                <Text
                  fontSize="2xl"
                  fontWeight="800"
                  color="blue.600"
                  lineHeight="1"
                >
                  {pricePerSeat.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  RWF/seat
                </Text>
              </VStack>
            </Flex>

            <Separator mb={5} />

            {/* Pickup address */}
            <Box bg="bg" borderRadius="xl" p={4} mb={5}>
              <Text fontSize="xs" color="fg.muted" mb={1}>
                Pickup point
              </Text>
              <Text fontSize="sm" fontWeight="500">
                {ride.pickup_point}
              </Text>
              <Link
                color="blue.500"
                fontSize="sm"
                cursor="pointer"
                onClick={() => setIsMapOpen(true)}
              >
                View on map
              </Link>
            </Box>

            {/* Booked state — show contact */}
            {isBooked || justBooked ? (
              <VStack gap={4}>
                <HStack
                  w="full"
                  bg="green.50"
                  _dark={{ bg: "green.950" }}
                  borderRadius="xl"
                  p={4}
                  gap={3}
                >
                  <Icon color="green.500" boxSize={5}>
                    <LuCheck />
                  </Icon>
                  <VStack align="start" gap={0}>
                    <Text
                      fontWeight="700"
                      fontSize="sm"
                      color="green.700"
                      _dark={{ color: "green.300" }}
                    >
                      Ride booked successfully
                    </Text>
                    <Text
                      fontSize="xs"
                      color="green.600"
                      _dark={{ color: "green.400" }}
                    >
                      Contact your driver below
                    </Text>
                  </VStack>
                </HStack>
                <HStack w="full" gap={3}>
                  <Button
                    flex={1}
                    size="lg"
                    bg="blue.50"
                    _dark={{ bg: "blue.900" }}
                    color="blue.600"
                    borderRadius="2xl"
                    variant="ghost"
                    onClick={handleCall}
                  >
                    <LuPhone size={18} />
                    Call Driver
                  </Button>
                  <Button
                    flex={1}
                    size="lg"
                    bg="green.50"
                    _dark={{ bg: "green.900" }}
                    color="green.600"
                    borderRadius="2xl"
                    variant="ghost"
                    onClick={handleWhatsApp}
                  >
                    <LuMessageCircle size={18} />
                    WhatsApp
                  </Button>
                </HStack>
              </VStack>
            ) : ride.available_seats === 0 ? (
              <Box
                w="full"
                bg="red.50"
                _dark={{ bg: "red.950" }}
                borderRadius="xl"
                p={4}
                textAlign="center"
              >
                <Text fontWeight="600" color="red.600">
                  This ride is fully booked
                </Text>
              </Box>
            ) : (
              <VStack gap={3}>
                <HStack
                  w="full"
                  bg="orange.50"
                  _dark={{ bg: "orange.950" }}
                  borderRadius="xl"
                  p={4}
                  gap={3}
                >
                  <Icon color="orange.500" boxSize={5}>
                    <LuLock />
                  </Icon>
                  <Text fontSize="sm" color="fg.muted">
                    Book this ride to see the driver's contact details
                  </Text>
                </HStack>
                <Button
                  w="full"
                  size="lg"
                  colorPalette="blue"
                  borderRadius="2xl"
                  onClick={() => setIsBookingOpen(true)}
                >
                  Book this ride · {pricePerSeat.toLocaleString()} RWF/seat
                </Button>
              </VStack>
            )}
          </Box>
        )}
      </Container>

      {/* Booking confirmation drawer */}
      <Drawer.Root
        open={isBookingOpen}
        onOpenChange={(e) => !e.open && setIsBookingOpen(false)}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content borderTopRadius="2xl">
              <Center pt="3" pb="1">
                <Box
                  width="40px"
                  height="4px"
                  bg="gray.300"
                  borderRadius="full"
                />
              </Center>
              <Drawer.Header>
                <Drawer.Title>Confirm Booking</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body pb={6}>
                <VStack gap={5}>
                  {/* Route summary */}
                  <Box w="full" bg="bg" borderRadius="xl" p={4}>
                    <HStack gap={3}>
                      <VStack gap={0} align="center" flexShrink={0}>
                        <Box
                          w="8px"
                          h="8px"
                          bg="blue.500"
                          borderRadius="full"
                        />
                        <Box w="1.5px" bg="gray.200" minH="20px" my="3px" />
                        <Box
                          w="8px"
                          h="8px"
                          bg="orange.500"
                          borderRadius="full"
                        />
                      </VStack>
                      <VStack align="start" gap={3} flex={1}>
                        <Text fontSize="sm" fontWeight="600">
                          {ride.origin}
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {ride.destination}
                        </Text>
                      </VStack>
                    </HStack>
                    <Separator mt={3} mb={3} />
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="fg.muted">
                        {dateLabel} · {timeLabel}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {ride.available_seats} seats left
                      </Text>
                    </HStack>
                  </Box>

                  {/* Driver */}
                  <HStack w="full" gap={3} bg="bg" borderRadius="xl" p={4}>
                    <Avatar.Root size="md" bg="blue.600">
                      <Avatar.Fallback color="white" fontWeight="700">
                        {initials}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="700">
                        {ride.driver.first_name} {ride.driver.last_name}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        {ride.car_model} · {ride.license_plate}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Seat selector */}
                  <HStack
                    w="full"
                    justify="space-between"
                    bg="bg"
                    borderRadius="xl"
                    p={4}
                  >
                    <VStack align="start" gap={0}>
                      <Text fontWeight="600">Number of seats</Text>
                      <Text fontSize="xs" color="fg.muted">
                        Max {ride.available_seats} available
                      </Text>
                    </VStack>
                    <NumberInput.Root
                      min={1}
                      max={ride.available_seats}
                      value={String(seats)}
                      onValueChange={(d) => setSeats(parseInt(d.value) || 1)}
                      width="120px"
                      colorPalette="blue"
                    >
                      <NumberInput.Control />
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </HStack>

                  {/* Price breakdown */}
                  <Box
                    w="full"
                    bg="blue.50"
                    _dark={{ bg: "blue.950" }}
                    borderRadius="xl"
                    p={4}
                  >
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="fg.muted">
                          {pricePerSeat.toLocaleString()} RWF × {seats} seat
                          {seats > 1 ? "s" : ""}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          {(pricePerSeat * seats).toLocaleString()} RWF
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="fg.muted">
                          Service fee
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          500 RWF
                        </Text>
                      </HStack>
                      <Separator />
                      <HStack justify="space-between">
                        <Text fontWeight="700">Total</Text>
                        <Text fontWeight="800" fontSize="xl" color="blue.600">
                          {(pricePerSeat * seats + 500).toLocaleString()} RWF
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Button
                    w="full"
                    size="lg"
                    colorPalette="blue"
                    borderRadius="2xl"
                    loading={isBooking}
                    onClick={handleConfirmBooking}
                  >
                    Confirm — Pay{" "}
                    {(pricePerSeat * seats + 500).toLocaleString()} RWF
                  </Button>
                  <Text fontSize="xs" color="fg.subtle" textAlign="center">
                    Includes 500 RWF service fee · Ride payment collected by
                    driver at pickup
                  </Text>
                </VStack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

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
    <VStack gap={0}>
      <Text fontSize="sm" color="fg.subtle" fontWeight="600">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="800">
        {value}
      </Text>
    </VStack>
  </VStack>
);
