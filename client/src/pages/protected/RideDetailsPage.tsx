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
  LuCircleCheck,
  LuClock,
  LuLock,
  LuMessageCircle,
  LuPencil,
  LuPhone,
  LuRefreshCw,
  LuTriangleAlert,
  LuUserPlus,
  LuUsers,
  LuUserX,
  LuX,
} from "react-icons/lu";
import { RideContext, type Ride, type RideStop } from "@/context/ride-context";
import { getCurrentUserId } from "@/utils/auth.util";
import axios from "axios";
import { baseUrl } from "@/main";
import { toaster } from "@/components/ui/toaster";

interface PassengerBooking {
  booking_id: string;
  seats: number;
  booked_at: string;
}

interface Passenger {
  booking_id: string; // primary booking id (for single cancel)
  all_booking_ids: string[]; // all booking ids for this passenger
  total_seats: number; // combined across all bookings
  booked_at: string;
  bookings: PassengerBooking[];
  passenger: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    is_verified: boolean;
  };
}

export const RideDetailsPage = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const rideContext = useContext(RideContext);

  const [ride, setRide] = useState<Ride | null>(null);
  const [loadingRide, setLoadingRide] = useState(true);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [justBooked, setJustBooked] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(
    null,
  );

  const currentUserId = getCurrentUserId();

  // ── Load ride ─────────────────────────────────────────────────────────────
  // Strategy: try context first (instant if navigated from list),
  // then fall back to REST (handles hard refresh / direct URL)
  useEffect(() => {
    if (!rideId) return;

    // Check context first
    const fromContext =
      rideContext?.rides.find((r) => r.id === rideId) ??
      rideContext?.singleRide ??
      null;

    if (fromContext) {
      setRide(fromContext);
      setLoadingRide(false);
      return;
    }

    // REST fallback — no spinner timeout needed
    const token = localStorage.getItem("token");
    axios
      .get<Ride>(`${baseUrl}/rides/${rideId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setRide(res.data))
      .catch(() => {}) // 404 — ride stays null, we show not-found below
      .finally(() => setLoadingRide(false));
  }, [rideId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ride in sync with WS updates (seat count, status changes)
  useEffect(() => {
    if (!rideId || !rideContext) return;
    const updated =
      rideContext.rides.find((r) => r.id === rideId) ?? rideContext.singleRide;
    if (updated) setRide(updated);
  }, [rideContext?.rides, rideContext?.singleRide, rideId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch passengers (driver only) ────────────────────────────────────────
  const isDriver = ride ? ride.driver.id === currentUserId : false;
  const isBooked = rideContext?.isRideBooked(ride?.id ?? "") ?? false;

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
  }, [isDriver, rideId, ride?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleConfirmBooking = async () => {
    if (!rideId) return;
    setIsBooking(true);
    try {
      await axios.post(
        `${baseUrl}/rides/${rideId}/book/`,
        { seats },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      await rideContext?.refreshBookings();
      setJustBooked(true);
      setIsBookingOpen(false);
      toaster.create({
        title: "Ride booked!",
        description: `${seats} seat${seats > 1 ? "s" : ""} confirmed.`,
        type: "success",
      });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Booking failed")
        : "Booking failed";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelRide = async () => {
    if (!rideId) return;
    setCancelling(true);
    try {
      await axios.post(
        `${baseUrl}/rides/${rideId}/cancel/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRide((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      toaster.create({ title: "Ride cancelled", type: "success" });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to cancel ride")
        : "Failed to cancel ride";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    if (!rideId) return;
    setReactivating(true);
    try {
      await axios.post(
        `${baseUrl}/rides/${rideId}/reactivate/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRide((prev) => (prev ? { ...prev, status: "active" } : prev));
      toaster.create({ title: "Ride reactivated", type: "success" });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to reactivate ride")
        : "Failed to reactivate ride";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setReactivating(false);
    }
  };

  const handleCancelPassenger = async (bookingId: string) => {
    if (!rideId) return;
    setCancellingBookingId(bookingId);
    try {
      await axios.post(
        `${baseUrl}/rides/${rideId}/passengers/${bookingId}/cancel/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPassengers((prev) => prev.filter((b) => b.booking_id !== bookingId));
      toaster.create({ title: "Passenger removed", type: "success" });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to remove passenger")
        : "Failed to remove passenger";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setCancellingBookingId(null);
    }
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loadingRide) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner color="blue.500" size="lg" />
      </Flex>
    );
  }

  if (!ride) {
    return (
      <Flex
        h="100vh"
        align="center"
        justify="center"
        direction="column"
        gap={4}
      >
        <Text color="fg.muted">Ride not found.</Text>
        <Button colorPalette="blue" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </Flex>
    );
  }

  const stops: RideStop[] = ride.stops ?? [];
  const isCancelled = ride.status === "cancelled";
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
  const totalPrice = pricePerSeat * seats + 500;

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
        gradientFrom={isCancelled ? "gray.500" : "blue.600"}
        gradientTo={isCancelled ? "gray.400" : "blue.500"}
        color="white"
        pt="3rem"
        pb={20}
      >
        <Container maxW="container.md">
          <Flex mb={10} justify="space-between" align="center">
            <IconButton
              borderRadius="full"
              bg={isCancelled ? "gray.600" : "blue.500"}
              onClick={() => navigate(-1)}
            >
              <LuArrowLeft />
            </IconButton>
            {isDriver && !isCancelled && (
              <Button
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: "blue.500" }}
                onClick={() => navigate(`/rides/${rideId}/edit`)}
              >
                <LuPencil />
                Edit Ride
              </Button>
            )}
          </Flex>

          {/* Cancelled banner in header */}
          {isCancelled && (
            <HStack
              bg="whiteAlpha.200"
              borderRadius="xl"
              px={4}
              py={2}
              mb={4}
              gap={2}
            >
              <Icon>
                <LuTriangleAlert />
              </Icon>
              <Text fontSize="sm" fontWeight="600">
                {isDriver
                  ? "You cancelled this ride"
                  : "This ride has been cancelled by the driver"}
              </Text>
            </HStack>
          )}

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
            value={isCancelled ? "—" : `${ride.available_seats} left`}
            iconBg={{ _light: "orange.100", _dark: "orange.800" }}
            iconColor="#D97706"
          />
        </HStack>

        {/* ── DRIVER VIEW ──────────────────────────────────────────────────── */}
        {isDriver ? (
          <Box bg="bg.panel" p="6" borderRadius="3xl" shadow="lg">
            <HStack justify="space-between" mb={5}>
              <Text fontWeight="800" fontSize="lg">
                Passengers
              </Text>
              <Badge
                colorPalette={isCancelled ? "red" : "blue"}
                variant="subtle"
                borderRadius="full"
                px={3}
              >
                {isCancelled ? "Cancelled" : `${passengers.length} booked`}
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
                {passengers.map((booking, index) => {
                  const hasMultipleBookings = booking.bookings.length > 1;

                  return (
                    <React.Fragment key={booking.passenger.id}>
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

                          {/* Seat summary */}
                          <HStack gap={2} mt={0.5} flexWrap="wrap">
                            <Text fontSize="xs" color="fg.subtle">
                              {booking.total_seats} seat
                              {booking.total_seats !== 1 ? "s" : ""} total
                            </Text>
                            {hasMultipleBookings && (
                              <>
                                <Text fontSize="xs" color="fg.subtle">
                                  ·
                                </Text>
                                {booking.bookings.map((b, i) => (
                                  <Badge
                                    key={b.booking_id}
                                    colorPalette="blue"
                                    variant="subtle"
                                    fontSize="2xs"
                                    borderRadius="full"
                                    px={2}
                                  >
                                    {i === 0
                                      ? `${b.seats} original`
                                      : `+${b.seats} added`}
                                  </Badge>
                                ))}
                              </>
                            )}
                          </HStack>
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
                              const p = booking.passenger.phone_number?.replace(
                                /\D/g,
                                "",
                              );
                              if (p)
                                window.open(`https://wa.me/${p}`, "_blank");
                            }}
                          >
                            <LuMessageCircle />
                          </IconButton>
                          {!isCancelled && (
                            <IconButton
                              aria-label="Remove passenger"
                              size="sm"
                              borderRadius="full"
                              colorPalette="red"
                              variant="outline"
                              loading={
                                cancellingBookingId === booking.booking_id
                              }
                              onClick={() =>
                                handleCancelPassenger(booking.booking_id)
                              }
                            >
                              <LuUserX />
                            </IconButton>
                          )}
                        </HStack>
                      </Flex>
                      {index < passengers.length - 1 && <Separator />}
                    </React.Fragment>
                  );
                })}
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

            {isCancelled ? (
              <Box
                mt={5}
                w="full"
                bg="red.50"
                _dark={{ bg: "red.950" }}
                borderRadius="xl"
                p={4}
              >
                <VStack gap={3}>
                  <Text
                    fontWeight="600"
                    color="red.600"
                    fontSize="sm"
                    textAlign="center"
                  >
                    This ride has been cancelled
                  </Text>
                  <Button
                    w="full"
                    colorPalette="blue"
                    borderRadius="xl"
                    loading={reactivating}
                    onClick={handleReactivate}
                  >
                    <LuRefreshCw />
                    Reactivate this ride
                  </Button>
                </VStack>
              </Box>
            ) : (
              <Button
                w="full"
                mt={5}
                colorPalette="red"
                variant="outline"
                borderRadius="2xl"
                loading={cancelling}
                onClick={handleCancelRide}
              >
                <LuX />
                Cancel this ride
              </Button>
            )}
          </Box>
        ) : (
          // ── PASSENGER VIEW ──────────────────────────────────────────────────
          <Box bg="bg.panel" p="6" borderRadius="3xl" shadow="lg">
            <Text fontWeight="800" fontSize="lg" mb="5">
              Driver
            </Text>
            <Flex gap="4" mb="6">
              <Avatar.Root size="lg" bg={isCancelled ? "gray.400" : "blue.600"}>
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
                <HStack gap={2} mt={1}>
                  <Text fontSize="sm" color="fg.muted">
                    Pickup:
                  </Text>
                  <Link
                    color="blue.500"
                    fontSize="sm"
                    cursor="pointer"
                    onClick={() => setIsMapOpen(true)}
                  >
                    View on map
                  </Link>
                </HStack>
              </VStack>
              <VStack align="end" gap={0}>
                <Text
                  fontSize="2xl"
                  fontWeight="800"
                  color={isCancelled ? "gray.400" : "blue.600"}
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

            <Box bg="bg" borderRadius="xl" p={4} mb={5}>
              <Text fontSize="xs" color="fg.muted" mb={1}>
                Pickup point
              </Text>
              <Text fontSize="sm" fontWeight="500">
                {ride.pickup_point}
              </Text>
            </Box>

            {/* ── Cancelled state — passenger ──────────────────────── */}
            {isCancelled ? (
              <Box
                w="full"
                bg="red.50"
                _dark={{ bg: "red.950" }}
                borderRadius="xl"
                p={5}
                borderWidth={1}
                borderColor={{ _light: "red.200", _dark: "red.800" }}
              >
                <HStack gap={3} mb={2}>
                  <Icon color="red.500" boxSize={5}>
                    <LuTriangleAlert />
                  </Icon>
                  <Text
                    fontWeight="700"
                    color="red.600"
                    _dark={{ color: "red.400" }}
                    fontSize="sm"
                  >
                    This ride has been cancelled
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  The driver cancelled this ride. If you had a booking, please
                  arrange alternative transport. Check your notifications for
                  details.
                </Text>
              </Box>
            ) : isBooked || justBooked ? (
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
                    <LuCircleCheck />
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
                    <LuPhone size={18} /> Call Driver
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
                    <LuMessageCircle size={18} /> WhatsApp
                  </Button>
                </HStack>
                {ride.available_seats > 0 && (
                  <Box
                    w="full"
                    bg="bg"
                    borderRadius="xl"
                    borderWidth={1}
                    borderColor="border"
                    p={4}
                  >
                    <HStack justify="space-between" align="center">
                      <VStack align="start" gap={0}>
                        <Text fontWeight="600" fontSize="sm">
                          Travelling with someone?
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {ride.available_seats} seat
                          {ride.available_seats !== 1 ? "s" : ""} still
                          available
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        colorPalette="blue"
                        borderRadius="xl"
                        onClick={() => setIsBookingOpen(true)}
                      >
                        <LuUserPlus />
                        Add seats
                      </Button>
                    </HStack>
                  </Box>
                )}
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

      {/* Booking drawer */}
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
                          {totalPrice.toLocaleString()} RWF
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
                    Confirm — Pay {totalPrice.toLocaleString()} RWF
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
