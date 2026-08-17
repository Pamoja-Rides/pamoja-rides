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
  LuBellRing,
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
import { DateCalendar } from "@/components/common";
import { PostRideContext } from "@/context/postRide-context";
import { PostRideProvider } from "@/context/PostRideProvider";
import { RescheduleModal } from "@/components/rides/RescheduleModal";
import {
  MomoPaymentDrawer,
  type EscrowPayment,
} from "@/components/payments/MomoPaymentDrawer";
import { QRCodeSVG } from "qrcode.react";

interface PassengerBooking {
  booking_id: string;
  seats: number;
  booked_at: string;
  payment_id: string | null;
  escrow_status: "none" | "locked" | "released" | "refunded" | null;
  arrival_confirmation_requested_at: string | null;
  pickup_confirmed_at: string | null;
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
  const [justBooked, setJustBooked] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(
    null,
  );
  const [showRescheduler, setShowRescheduler] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [arrivingStopId, setArrivingStopId] = useState<string | null>(null);
  const [arrivingDestination, setArrivingDestination] = useState(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [myPayment, setMyPayment] = useState<EscrowPayment | null>(null);
  const [loadingMyPayment, setLoadingMyPayment] = useState(false);
  const [reportingNoShow, setReportingNoShow] = useState(false);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [requestingConfirmationId, setRequestingConfirmationId] = useState<
    string | null
  >(null);
  const [verifyingBookingId, setVerifyingBookingId] = useState<string | null>(
    null,
  );
  const [pickupCodeInput, setPickupCodeInput] = useState("");
  const [verifyingPickup, setVerifyingPickup] = useState(false);

  const SERVICE_FEE_RWF = 500; // mirror of backend settings.BOOKING_FEE_RWF, display only

  const handleReportNoShow = async () => {
    if (!myPayment || myPayment.id === "dev-simulated") return;
    setReportingNoShow(true);
    try {
      const res = await axios.post<EscrowPayment>(
        `${baseUrl}/payments/${myPayment.id}/no-show/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setMyPayment(res.data);
      toaster.create({
        title: "No-show reported",
        description: "You've been fully refunded.",
        type: "success",
      });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to report no-show")
        : "Failed to report no-show";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setReportingNoShow(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!myPayment || myPayment.id === "dev-simulated") return;
    setConfirmingArrival(true);
    try {
      const res = await axios.post<EscrowPayment>(
        `${baseUrl}/payments/${myPayment.id}/confirm-arrival/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setMyPayment(res.data);
      toaster.create({
        title: "Arrival confirmed",
        description: `${Number(res.data.driver_payout_amount ?? 0).toLocaleString()} RWF sent to the driver's MoMo.`,
        type: "success",
      });
    } catch (err) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      if (data?.payment) {
        // Payout failed but the confirmation itself was recorded — still
        // update local state so the retry banner shows.
        setMyPayment(data.payment as EscrowPayment);
      }
      const msg =
        data?.error ?? "Failed to confirm arrival. Please try again.";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setConfirmingArrival(false);
    }
  };

  const handleRequestArrivalConfirmation = async (
    paymentId: string,
    opts?: { silent?: boolean },
  ) => {
    if (!opts?.silent) setRequestingConfirmationId(paymentId);
    try {
      await axios.post(
        `${baseUrl}/payments/${paymentId}/request-arrival-confirmation/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPassengers((prev) =>
        prev.map((p) => ({
          ...p,
          bookings: p.bookings.map((b) =>
            b.payment_id === paymentId
              ? { ...b, arrival_confirmation_requested_at: new Date().toISOString() }
              : b,
          ),
        })),
      );
      if (!opts?.silent) {
        toaster.create({
          title: "Passenger notified",
          description: "They'll get a prompt to confirm their arrival.",
          type: "success",
        });
      }
    } catch {
      if (!opts?.silent) {
        toaster.create({
          title: "Couldn't send the reminder. Try again.",
          type: "error",
        });
      }
    } finally {
      if (!opts?.silent) setRequestingConfirmationId(null);
    }
  };

  const handleVerifyPickup = async () => {
    if (!verifyingBookingId) return;
    setVerifyingPickup(true);
    try {
      await axios.post(
        `${baseUrl}/rides/bookings/${verifyingBookingId}/verify-pickup/`,
        { code: pickupCodeInput.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPassengers((prev) =>
        prev.map((p) => ({
          ...p,
          bookings: p.bookings.map((b) =>
            b.booking_id === verifyingBookingId
              ? { ...b, pickup_confirmed_at: new Date().toISOString() }
              : b,
          ),
        })),
      );
      toaster.create({ title: "Pickup confirmed", type: "success" });
      setVerifyingBookingId(null);
      setPickupCodeInput("");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      toaster.create({
        title: msg ?? "Incorrect code. Try again.",
        type: "error",
      });
    } finally {
      setVerifyingPickup(false);
    }
  };

  const handleRequestPayoutUrgently = async (paymentId: string) => {
    setRequestingConfirmationId(paymentId);
    try {
      await axios.post(
        `${baseUrl}/payments/${paymentId}/request-arrival-confirmation/`,
        { urgent: true },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPassengers((prev) =>
        prev.map((p) => ({
          ...p,
          bookings: p.bookings.map((b) =>
            b.payment_id === paymentId
              ? { ...b, arrival_confirmation_requested_at: new Date().toISOString() }
              : b,
          ),
        })),
      );
      toaster.create({
        title: "Urgent request sent",
        description: "The passenger was notified this needs their attention now.",
        type: "success",
      });
    } catch {
      toaster.create({
        title: "Couldn't send the request. Try again.",
        type: "error",
      });
    } finally {
      setRequestingConfirmationId(null);
    }
  };

  const handleMarkStopArrived = async (stopId: string) => {
    if (!rideId) return;
    setArrivingStopId(stopId);
    try {
      await axios.post(
        `${baseUrl}/rides/${rideId}/stops/${stopId}/arrive/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRide((prev) =>
        prev
          ? {
              ...prev,
              stops: prev.stops.map((s) =>
                s.id === stopId
                  ? { ...s, arrived_at: new Date().toISOString() }
                  : s,
              ),
            }
          : prev,
      );
    } catch {
      toaster.create({ title: "Failed to mark arrival", type: "error" });
    } finally {
      setArrivingStopId(null);
    }
  };

  const handleMarkDestinationArrived = async () => {
    if (!rideId) return;
    setArrivingDestination(true);
    try {
      const res = await axios.post(
        `${baseUrl}/rides/${rideId}/arrive/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRide((prev) =>
        prev
          ? { ...prev, arrived_at_destination: new Date().toISOString() }
          : prev,
      );

      // Marking the destination as arrived also nudges every passenger
      // with a locked escrow payment to confirm their own arrival, since
      // the two actions are effectively the same moment for the driver.
      const lockedPaymentIds = passengers
        .flatMap((p) => p.bookings)
        .filter(
          (b) =>
            b.payment_id &&
            b.escrow_status === "locked" &&
            !b.arrival_confirmation_requested_at,
        )
        .map((b) => b.payment_id as string);

      if (lockedPaymentIds.length > 0) {
        await Promise.allSettled(
          lockedPaymentIds.map((paymentId) =>
            handleRequestArrivalConfirmation(paymentId, { silent: true }),
          ),
        );
      }

      const payout = res.data?.payout_summary as
        | { released_count: number; total_payout: string; failed_count: number }
        | undefined;
      if (payout && Number(payout.released_count) > 0) {
        toaster.create({
          title: "Arrival confirmed",
          description: `${Number(payout.total_payout).toLocaleString()} RWF sent to your MoMo.`,
          type: "success",
        });
      } else if (payout && payout.failed_count > 0) {
        toaster.create({
          title: "Arrival confirmed",
          description:
            "Payout couldn't be sent right now — it'll be retried. Contact support if it doesn't arrive.",
          type: "warning",
        });
      } else if (lockedPaymentIds.length > 0) {
        toaster.create({
          title: "Arrival confirmed",
          description: "Passengers have been asked to confirm their arrival.",
          type: "success",
        });
      } else {
        toaster.create({ title: "Arrival confirmed", type: "success" });
      }
    } catch {
      toaster.create({ title: "Failed to mark arrival", type: "error" });
    } finally {
      setArrivingDestination(false);
    }
  };

  const currentUserId = getCurrentUserId();

  // ── Load ride ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rideId) return;

    const fromContext =
      rideContext?.rides.find((r) => r.id === rideId) ??
      rideContext?.singleRide ??
      null;

    if (fromContext) {
      setRide(fromContext);
      setLoadingRide(false);
      return;
    }

    const token = localStorage.getItem("token");
    axios
      .get<Ride>(`${baseUrl}/rides/${rideId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setRide(res.data))
      .catch(() => {})
      .finally(() => setLoadingRide(false));
  }, [rideId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (isDriver || !rideId || !isBooked) return;
    setLoadingMyPayment(true);
    axios
      .get<EscrowPayment>(`${baseUrl}/payments/ride/${rideId}/mine/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setMyPayment(res.data))
      .catch(() => {})
      .finally(() => setLoadingMyPayment(false));
  }, [isDriver, rideId, isBooked]);

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

  const handleConfirmBooking = () => {
    setIsBookingOpen(false);
    setShowPaymentDrawer(true);
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

  const handleReactivate = async (newDatetime?: string) => {
    if (!rideId) return;
    setReactivating(true);
    try {
      await axios.post(
        `${baseUrl}/rides/${rideId}/reactivate/`,
        newDatetime ? { departure_datetime: newDatetime } : {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      await rideContext?.refreshBookings();

      // Clear passenger list immediately — driver's view shouldn't show
      // stale passengers while we refetch
      setPassengers([]);

      setRide((prev) =>
        prev
          ? {
              ...prev,
              status: "active",
              departure_datetime: newDatetime ?? prev.departure_datetime,
            }
          : prev,
      );

      // Refetch passengers from the backend — will correctly return empty
      // since reactivation clears all bookings server-side
      if (isDriver && rideId) {
        try {
          const res = await axios.get(
            `${baseUrl}/rides/${rideId}/passengers/`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          setPassengers(res.data);
        } catch {
          // non-fatal — list just stays empty until next natural refetch
        }
      }

      setShowRescheduleModal(false);
      toaster.create({
        title: "Ride reactivated",
        description:
          "Previous bookings were cleared — the ride is open for booking again.",
        type: "success",
      });
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.data?.code === "DEPARTURE_PASSED"
      ) {
        setShowRescheduleModal(true);
        return;
      }
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to reactivate ride")
        : "Failed to reactivate ride";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setReactivating(false);
    }
  };

  const doReactivate = async () => {
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
        ? (err.response?.data?.error ?? "Failed to reactivate")
        : "Failed to reactivate";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setReactivating(false);
    }
  };

  const handleRescheduleAndReactivate = async (newDatetime: string) => {
    if (!rideId) return;
    setRescheduleSaving(true);
    try {
      await axios.patch(
        `${baseUrl}/rides/${rideId}/edit/`,
        { departure_datetime: newDatetime },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRide((prev) =>
        prev ? { ...prev, departure_datetime: newDatetime } : prev,
      );
      setShowRescheduler(false);
      await doReactivate();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to update departure time")
        : "Failed to update departure time";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setRescheduleSaving(false);
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
    <Box position="relative" minH="100vh" overflowX="hidden">
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
            <VStack gap="0" align="center" py="1.5" flexShrink={0}>
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
            <VStack align="start" gap="4" flex={1} minW={0}>
              <Box maxW="full">
                <Text fontSize="xs" color="whiteAlpha.700">
                  From
                </Text>
                <Text fontWeight="bold" textStyle="sm" wordBreak="break-word">
                  {ride.origin}
                </Text>
              </Box>
              {stops.map((stop) => (
                <Box key={stop.id} maxW="full">
                  <Text fontSize="xs" color="whiteAlpha.600">
                    Stop
                  </Text>
                  <Text
                    fontWeight="semibold"
                    textStyle="sm"
                    color="whiteAlpha.900"
                    wordBreak="break-word"
                  >
                    {stop.name}
                  </Text>
                </Box>
              ))}
              <Box maxW="full">
                <Text fontSize="xs" color="whiteAlpha.700">
                  To
                </Text>
                <Text fontWeight="bold" textStyle="sm" wordBreak="break-word">
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
          <>
            {/* ── Route Progress card — arrival tracking, only while active ── */}
            {!isCancelled && (
              <Box bg="bg.panel" p="6" borderRadius="3xl" shadow="lg" mb={4}>
                <Text fontWeight="800" fontSize="lg" mb={4}>
                  Route Progress
                </Text>
                <VStack gap={0} align="stretch">
                  {stops.map((stop) => (
                    <Flex key={stop.id} align="center" gap={3} py={3}>
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={stop.arrived_at ? "green.500" : "gray.300"}
                        flexShrink={0}
                      />
                      <Text
                        flex={1}
                        minW={0}
                        wordBreak="break-word"
                        fontSize="sm"
                        fontWeight={stop.arrived_at ? "500" : "600"}
                        color={stop.arrived_at ? "fg.muted" : "fg"}
                      >
                        {stop.name}
                      </Text>
                      {stop.arrived_at ? (
                        <Badge
                          colorPalette="green"
                          variant="subtle"
                          borderRadius="full"
                        >
                          Arrived
                        </Badge>
                      ) : (
                        <Button
                          size="xs"
                          colorPalette="blue"
                          variant="outline"
                          borderRadius="full"
                          loading={arrivingStopId === stop.id}
                          onClick={() => handleMarkStopArrived(stop.id)}
                        >
                          Mark arrived
                        </Button>
                      )}
                    </Flex>
                  ))}

                  <Flex align="center" gap={3} py={3}>
                    <Box
                      w="11px"
                      h="11px"
                      borderRadius="full"
                      bg={
                        ride.arrived_at_destination ? "green.500" : "orange.500"
                      }
                      flexShrink={0}
                    />
                    <Text
                      flex={1}
                      minW={0}
                      wordBreak="break-word"
                      fontSize="sm"
                      fontWeight={ride.arrived_at_destination ? "500" : "700"}
                      color={ride.arrived_at_destination ? "fg.muted" : "fg"}
                    >
                      {ride.destination}
                    </Text>
                    {ride.arrived_at_destination ? (
                      <Badge
                        colorPalette="green"
                        variant="subtle"
                        borderRadius="full"
                      >
                        Arrived
                      </Badge>
                    ) : (() => {
                      const allVerified =
                        passengers.length > 0 &&
                        passengers.every((p) =>
                          p.bookings.every((b) => b.pickup_confirmed_at),
                        );
                      return allVerified ? (
                        <Button
                          size="xs"
                          colorPalette="blue"
                          borderRadius="full"
                          loading={arrivingDestination}
                          onClick={handleMarkDestinationArrived}
                        >
                          Mark arrived
                        </Button>
                      ) : (
                        <Text fontSize="2xs" color="fg.muted" textAlign="right" maxW="80px">
                          Verify all pickups first
                        </Text>
                      );
                    })()}
                  </Flex>
                </VStack>
              </Box>
            )}

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

                            {(() => {
                              const primaryBooking = booking.bookings[0];
                              const lockedPayment = booking.bookings.find(
                                (b) =>
                                  b.payment_id &&
                                  b.escrow_status === "locked",
                              );

                              return (
                                <VStack align="start" gap={1.5} mt={2} w="full">
                                  {primaryBooking &&
                                    !primaryBooking.pickup_confirmed_at && (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        colorPalette="blue"
                                        borderRadius="full"
                                        onClick={() => {
                                          setVerifyingBookingId(
                                            primaryBooking.booking_id,
                                          );
                                          setPickupCodeInput("");
                                        }}
                                      >
                                        Verify pickup code
                                      </Button>
                                    )}
                                  {primaryBooking?.pickup_confirmed_at && (
                                    <HStack gap={1}>
                                      <Icon color="green.500" boxSize={3}>
                                        <LuCircleCheck />
                                      </Icon>
                                      <Text
                                        fontSize="2xs"
                                        color="green.600"
                                        fontWeight="600"
                                      >
                                        Pickup verified
                                      </Text>
                                    </HStack>
                                  )}

                                  {lockedPayment &&
                                    lockedPayment.payment_id &&
                                    primaryBooking?.pickup_confirmed_at && (
                                    <HStack gap={2} flexWrap="wrap">
                                      {lockedPayment.arrival_confirmation_requested_at && (
                                        <HStack gap={1}>
                                          <Icon color="orange.500" boxSize={3}>
                                            <LuBellRing />
                                          </Icon>
                                          <Text
                                            fontSize="2xs"
                                            color="orange.600"
                                            fontWeight="600"
                                          >
                                            Asked to confirm arrival
                                          </Text>
                                        </HStack>
                                      )}
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        colorPalette="red"
                                        borderRadius="full"
                                        loading={
                                          requestingConfirmationId ===
                                          lockedPayment.payment_id
                                        }
                                        onClick={() =>
                                          handleRequestPayoutUrgently(
                                            lockedPayment.payment_id!,
                                          )
                                        }
                                      >
                                        Request payout urgently
                                      </Button>
                                    </HStack>
                                  )}
                                </VStack>
                              );
                            })()}
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
                                const p =
                                  booking.passenger.phone_number?.replace(
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
                      onClick={() => handleReactivate()}
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
          </>
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

                {loadingMyPayment ? (
                  <Center py={2}>
                    <Spinner size="sm" color="blue.500" />
                  </Center>
                ) : myPayment?.escrow_status === "locked" ? (
                  <Box
                    w="full"
                    bg="orange.50"
                    _dark={{ bg: "orange.950" }}
                    borderRadius="xl"
                    p={4}
                  >
                    <HStack gap={2} mb={2}>
                      <Icon color="orange.500" boxSize={4}>
                        <LuLock />
                      </Icon>
                      <Text fontSize="sm" fontWeight="600">
                        {Number(myPayment.fare_amount).toLocaleString()} RWF
                        held until you arrive
                      </Text>
                    </HStack>
                    {myPayment.pickup_code && !myPayment.pickup_confirmed_at && (
                      <Box
                        bg="white"
                        _dark={{ bg: "gray.900", borderColor: "blue.800" }}
                        borderRadius="xl"
                        p={4}
                        mb={2}
                        borderWidth={1}
                        borderColor="blue.200"
                        textAlign="center"
                      >
                        <Text fontSize="xs" color="fg.muted" mb={3}>
                          Show this QR code to your driver at pickup
                        </Text>
                        <Center mb={3}>
                          <Box
                            bg="white"
                            p={3}
                            borderRadius="lg"
                            display="inline-block"
                          >
                            <QRCodeSVG
                              value={`pamoja-pickup:${myPayment.pickup_code}`}
                              size={140}
                              level="M"
                              includeMargin={false}
                            />
                          </Box>
                        </Center>
                        <Text
                          fontSize="xs"
                          color="fg.subtle"
                          letterSpacing="widest"
                          fontWeight="600"
                        >
                          Code: {myPayment.pickup_code}
                        </Text>
                      </Box>
                    )}
                    {myPayment.pickup_confirmed_at && (
                      <HStack gap={1.5} mb={2}>
                        <Icon color="green.500" boxSize={3.5}>
                          <LuCircleCheck />
                        </Icon>
                        <Text fontSize="xs" color="green.600" fontWeight="600">
                          Pickup confirmed
                        </Text>
                      </HStack>
                    )}
                    {myPayment.pickup_confirmed_at ? (
                      <>
                        {myPayment.arrival_confirmation_requested_at && (
                          <Box
                            bg="orange.50"
                            borderWidth={1}
                            borderColor="orange.200"
                            borderRadius="lg"
                            px={3}
                            py={2}
                            mb={2}
                          >
                            <Text fontSize="xs" color="orange.700" fontWeight="600">
                              Your driver says you've arrived — confirm below to
                              release their payment.
                            </Text>
                          </Box>
                        )}
                        <Text fontSize="xs" color="fg.muted" mb={2}>
                          Arrived at your destination? Confirm to release the
                          fare to the driver's MoMo.
                        </Text>
                        <Button
                          size="sm"
                          w="full"
                          colorPalette="green"
                          borderRadius="xl"
                          mb={2}
                          loading={confirmingArrival}
                          onClick={handleConfirmArrival}
                        >
                          <LuCircleCheck />
                          Confirm arrival
                        </Button>
                        {myPayment.disbursement_status === "failed" && (
                          <Text fontSize="xs" color="red.500" mb={2}>
                            Last payout attempt failed. Tap "Confirm arrival"
                            again to retry.
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text fontSize="xs" color="fg.muted" mb={2}>
                        Waiting for the driver to verify your pickup before
                        arrival can be confirmed.
                      </Text>
                    )}
                    {!ride.arrived_at_destination && (
                      <>
                        <Text fontSize="xs" color="fg.muted" mb={2}>
                          {myPayment?.pickup_confirmed_at
                            ? "Changed your mind? Cancel to get a full refund."
                            : "Driver never showed up? Report it for a full refund."}
                        </Text>
                        <Button
                          size="sm"
                          w="full"
                          colorPalette="red"
                          variant="outline"
                          borderRadius="xl"
                          loading={reportingNoShow}
                          onClick={handleReportNoShow}
                        >
                          <LuUserX />
                          {myPayment?.pickup_confirmed_at
                            ? "Cancel ride & refund"
                            : "Report driver no-show"}
                        </Button>
                      </>
                    )}
                  </Box>
                ) : myPayment?.escrow_status === "released" ? (
                  <HStack
                    w="full"
                    bg="green.50"
                    _dark={{ bg: "green.950" }}
                    borderRadius="xl"
                    p={3}
                    gap={2}
                  >
                    <Icon color="green.500" boxSize={4}>
                      <LuCircleCheck />
                    </Icon>
                    <Text fontSize="xs" color="fg.muted">
                      Fare released to the driver. Ride complete.
                    </Text>
                  </HStack>
                ) : myPayment?.escrow_status === "refunded" ? (
                  <HStack
                    w="full"
                    bg="red.50"
                    _dark={{ bg: "red.950" }}
                    borderRadius="xl"
                    p={3}
                    gap={2}
                  >
                    <Icon color="red.500" boxSize={4}>
                      <LuTriangleAlert />
                    </Icon>
                    <Text fontSize="xs" color="fg.muted">
                      You were fully refunded for the no-show.
                    </Text>
                  </HStack>
                ) : null}
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
            <Drawer.Content borderTopRadius="2xl" css={{ maxWidth: "480px !important", marginInline: "auto" }}>
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
                    loading={false}
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
            <Drawer.Content borderTopRadius="2xl" overflow="hidden" css={{ maxWidth: "480px !important", marginInline: "auto" }}>
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

      {/* Rescheduler drawer — shown when reactivating a past ride */}
      <Drawer.Root
        open={showRescheduler}
        placement="bottom"
        onOpenChange={(e) => !e.open && setShowRescheduler(false)}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content borderTopRadius="2xl" css={{ maxWidth: "480px !important", marginInline: "auto" }}>
              <Center pt="3" pb="1">
                <Box
                  width="40px"
                  height="4px"
                  bg="gray.300"
                  borderRadius="full"
                />
              </Center>
              <Drawer.Header>
                <VStack align="start" gap={0}>
                  <Drawer.Title>Update Departure Time</Drawer.Title>
                  <Text fontSize="xs" color="fg.muted">
                    The original departure time has passed. Pick a new one to
                    reactivate.
                  </Text>
                </VStack>
              </Drawer.Header>
              <Drawer.Body pb={6}>
                <PostRideProvider>
                  <ReschedulePicker
                    onConfirm={handleRescheduleAndReactivate}
                    saving={rescheduleSaving}
                    onCancel={() => setShowRescheduler(false)}
                  />
                </PostRideProvider>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <RescheduleModal
        open={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onConfirm={(newDatetime) => handleReactivate(newDatetime)}
        saving={reactivating}
      />
      <MomoPaymentDrawer
        open={showPaymentDrawer}
        onClose={() => setShowPaymentDrawer(false)}
        rideId={rideId ?? ""}
        seats={seats}
        farePerSeat={pricePerSeat}
        serviceFee={SERVICE_FEE_RWF}
        onPaid={async (payment) => {
          setMyPayment(payment);
          setJustBooked(true);
          setIsBookingOpen(false);
          setShowPaymentDrawer(false);
          // Refresh booked-ride state and seat count from the server —
          // the booking was created server-side once MoMo confirmed.
          await rideContext?.refreshBookings();
          if (rideId) {
            axios
              .get(`${baseUrl}/rides/${rideId}/`)
              .then((res) => setRide(res.data))
              .catch(() => {});
          }
        }}
      />

      <Drawer.Root
        open={!!verifyingBookingId}
        onOpenChange={(e) => {
          if (!e.open) {
            setVerifyingBookingId(null);
            setPickupCodeInput("");
          }
        }}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content borderTopRadius="2xl" css={{ maxWidth: "480px !important", marginInline: "auto" }}>
              <Drawer.Header>
                <Drawer.Title>Verify pickup</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body pb={6}>
                <VStack gap={4} align="stretch">
                  <Text fontSize="sm" color="fg.muted">
                    Scan the passenger's QR code to verify pickup, or enter
                    the 4-digit code manually.
                  </Text>

                  {/* Live camera QR scanner */}
                  <QRScannerBox
                    onScan={(code) => {
                      setPickupCodeInput(code);
                      toaster.create({ title: "QR code scanned", type: "success" });
                    }}
                  />

                  <Text fontSize="xs" color="fg.muted" textAlign="center">
                    — or enter manually —
                  </Text>

                  <NumberInput.Root
                    value={pickupCodeInput}
                    onValueChange={(e) =>
                      setPickupCodeInput(e.value.slice(0, 4))
                    }
                  >
                    <NumberInput.Input
                      placeholder="0000"
                      textAlign="center"
                      fontSize="2xl"
                      letterSpacing="widest"
                      fontWeight="700"
                    />
                  </NumberInput.Root>

                  <Button
                    colorPalette="blue"
                    borderRadius="xl"
                    loading={verifyingPickup}
                    disabled={pickupCodeInput.trim().length !== 4}
                    onClick={handleVerifyPickup}
                  >
                    Verify & confirm pickup
                  </Button>
                </VStack>
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

// Inline rescheduler — wraps DateCalendar and reads departure_datetime from PostRideContext
const ReschedulePicker = ({
  onConfirm,
  saving,
  onCancel,
}: {
  onConfirm: (dt: string) => void;
  saving: boolean;
  onCancel: () => void;
}) => {
  const ctx = useContext(PostRideContext);
  const dt = ctx?.formData.departure_datetime ?? "";
  const isValid = dt !== "" && new Date(dt) > new Date();

  return (
    <VStack gap={5}>
      <DateCalendar />
      {dt && !isValid && (
        <Text fontSize="xs" color="red.500">
          Please pick a future date and time.
        </Text>
      )}
      <HStack w="full" gap={3}>
        <Button flex={1} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          flex={2}
          colorPalette="blue"
          borderRadius="xl"
          disabled={!isValid}
          loading={saving}
          onClick={() => onConfirm(dt)}
        >
          <LuRefreshCw />
          Save & Reactivate
        </Button>
      </HStack>
    </VStack>
  );
};

// ── Live camera QR scanner ────────────────────────────────────────────────────
// Uses getUserMedia to stream the rear camera into a <video>, then decodes
// frames with jsQR every 300ms. Stops scanning as soon as a valid code is found.
const QRScannerBox = ({ onScan }: { onScan: (code: string) => void }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const stop = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    intervalRef.current = null;
    streamRef.current = null;
    setScanning(false);
  }, []);

  React.useEffect(() => () => stop(), [stop]);

  const startScanLoop = React.useCallback(async () => {
    const jsQR = (await import("jsqr")).default;
    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.paused) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, canvas.width, canvas.height);
      if (result?.data?.startsWith("pamoja-pickup:")) {
        const code = result.data.replace("pamoja-pickup:", "");
        stop();
        setDone(true);
        onScan(code);
      }
    }, 300);
  }, [onScan, stop]);

  const start = React.useCallback(async () => {
    setError(null);
    setDone(false);
    try {
      // Use ideal not exact — works on MacBook (no rear camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.onloadeddata = () => {
        video.play().then(() => {
          setScanning(true);
          startScanLoop();
        }).catch(() => {
          setError("Could not start camera preview.");
        });
      };
    } catch (e) {
      console.error(e);
      setError("Camera access denied or not available. Enter the code manually.");
    }
  }, [startScanLoop]);

  if (done) return null;

  return (
    <Box borderRadius="xl" overflow="hidden" borderWidth={1} borderColor="border" position="relative" bg="black">
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "200px",
          objectFit: "cover",
          display: scanning ? "block" : "none",
        }}
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {scanning && (
        <>
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
            <Box w="180px" h="180px" borderWidth={2} borderColor="blue.400" borderRadius="2xl" borderStyle="dashed" />
          </Box>
          <Button size="xs" position="absolute" top={2} right={2} onClick={stop} colorPalette="gray" variant="solid">
            Stop
          </Button>
        </>
      )}
      {!scanning && (
        <Box
          p={6}
          textAlign="center"
          cursor="pointer"
          onClick={start}
          bg="blue.50"
          _dark={{ bg: "blue.950" }}
          _hover={{ opacity: 0.85 }}
          h="200px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
        >
          <Text fontSize="3xl">📷</Text>
          <Text fontSize="sm" fontWeight="600" color="blue.600">
            Tap to scan QR code
          </Text>
          {error && (
            <Text fontSize="xs" color="red.500" mt={1}>
              {error}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};
