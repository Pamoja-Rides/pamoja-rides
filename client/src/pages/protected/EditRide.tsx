import {
  Alert,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LuArrowLeft, LuPlus, LuX } from "react-icons/lu";
import { LocationComboBox } from "@/components/common";
import { DateCalendar } from "@/components/common";
import { RideContext } from "@/context/ride-context";
import type { Ride, RideStop } from "@/context/ride-context";
import { baseUrl } from "@/main";
import { toaster } from "@/components/ui/toaster";
import { PostRideContext } from "@/context/postRide-context";
import { PostRideProvider } from "@/context/PostRideProvider";
import type { LocationOption } from "@/types/location";

// Wrap so DateCalendar can read PostRideContext for departure_datetime
export const EditRide = () => (
  <PostRideProvider>
    <EditRideInner />
  </PostRideProvider>
);

interface EditForm {
  origin: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination: string;
  destination_lat: number | null;
  destination_lng: number | null;
  pickup_point: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  departure_datetime: string;
  car_model: string;
  license_plate: string;
  available_seats: number;
  price_per_seat: number;
  stops: { name: string; lat: number | null; lng: number | null }[];
}

const EditRideInner = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const rideContext = useContext(RideContext);
  const postRideContext = useContext(PostRideContext);

  const ride: Ride | null =
    rideContext?.rides.find((r) => r.id === rideId) ??
    rideContext?.singleRide ??
    null;

  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ride if not in context
  useEffect(() => {
    if (!ride && rideId && rideContext?.sendWSMessage) {
      rideContext.sendWSMessage("fetch_one", { ride_id: rideId });
    }
  }, [ride, rideId, rideContext]);

  // Populate form once ride is available
  useEffect(() => {
    if (ride && !form) {
      setForm({
        origin: ride.origin,
        origin_lat: ride.origin_lat ? Number(ride.origin_lat) : null,
        origin_lng: ride.origin_lng ? Number(ride.origin_lng) : null,
        destination: ride.destination,
        destination_lat: ride.destination_lat
          ? Number(ride.destination_lat)
          : null,
        destination_lng: ride.destination_lng
          ? Number(ride.destination_lng)
          : null,
        pickup_point: ride.pickup_point,
        pickup_lat: ride.pickup_lat ? Number(ride.pickup_lat) : null,
        pickup_lng: ride.pickup_lng ? Number(ride.pickup_lng) : null,
        departure_datetime: ride.departure_datetime,
        car_model: ride.car_model,
        license_plate: ride.license_plate,
        available_seats: ride.available_seats,
        price_per_seat: Number(ride.price_per_seat),
        stops: (ride.stops ?? []).map((s: RideStop) => ({
          name: s.name,
          lat: s.lat ? Number(s.lat) : null,
          lng: s.lng ? Number(s.lng) : null,
        })),
      });

      // Sync departure_datetime into PostRideContext so DateCalendar works
      if (postRideContext) {
        postRideContext.setFormData((prev) => ({
          ...prev,
          departure_datetime: ride.departure_datetime,
        }));
      }
    }
  }, [ride]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep departure_datetime in sync from DateCalendar (which writes to PostRideContext)
  useEffect(() => {
    if (postRideContext?.formData.departure_datetime && form) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              departure_datetime: postRideContext.formData.departure_datetime,
            }
          : prev,
      );
    }
  }, [postRideContext?.formData.departure_datetime]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<EditForm>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleOriginSelect = (loc: LocationOption) =>
    set({
      origin: loc.name,
      origin_lat: loc.latitude,
      origin_lng: loc.longitude,
    });

  const handleDestinationSelect = (loc: LocationOption) =>
    set({
      destination: loc.name,
      destination_lat: loc.latitude,
      destination_lng: loc.longitude,
    });

  const handlePickupSelect = (loc: LocationOption) =>
    set({
      pickup_point: loc.name,
      pickup_lat: loc.latitude,
      pickup_lng: loc.longitude,
    });

  const addStop = () =>
    set({
      stops: [...(form?.stops ?? []), { name: "", lat: null, lng: null }],
    });

  const removeStop = (index: number) =>
    set({ stops: form!.stops.filter((_, i) => i !== index) });

  const updateStop = (index: number, loc: LocationOption) => {
    const stops = [...form!.stops];
    stops[index] = { name: loc.name, lat: loc.latitude, lng: loc.longitude };
    set({ stops });
  };

  const handleSave = async () => {
    if (!form || !rideId) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(
        `${baseUrl}/rides/${rideId}/edit/`,
        {
          ...form,
          stops: form.stops.filter((s) => s.name.trim() !== ""),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toaster.create({ title: "Ride updated successfully", type: "success" });
      navigate(`/rides/${rideId}`, { replace: true });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to save changes")
        : "Failed to save changes";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!ride || !form) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner color="blue.500" size="lg" />
      </Flex>
    );
  }

  const priceNum = Number(form.price_per_seat) || 0;
  const commission = Math.round(priceNum * 0.1);
  const driverEarns = priceNum - commission;

  return (
    <Flex direction="column" minH="100vh" pb={10}>
      {/* Header */}
      <Box
        bgGradient="to-r"
        gradientFrom="blue.600"
        gradientTo="blue.500"
        color="white"
        pt="3rem"
        pb={6}
        px={5}
      >
        <HStack gap={3}>
          <IconButton
            aria-label="Back"
            borderRadius="full"
            bg="blue.500"
            color="white"
            _hover={{ bg: "blue.400" }}
            onClick={() => navigate(-1)}
          >
            <LuArrowLeft />
          </IconButton>
          <Heading size="md" color="white">
            Edit Ride
          </Heading>
        </HStack>
      </Box>

      <VStack px={5} pt={5} gap={6} align="stretch">
        {error && (
          <Alert.Root status="error" variant="surface" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title fontSize="sm">{error}</Alert.Title>
          </Alert.Root>
        )}

        {/* Route section */}
        <Box bg="bg.panel" borderRadius="2xl" p={5} shadow="md">
          <Text fontWeight="700" mb={4}>
            Route
          </Text>
          <VStack gap={4} align="stretch">
            <Field.Root required>
              <Field.Label>From</Field.Label>
              <LocationComboBox
                placeholder="Where from?"
                value={form.origin}
                onSelect={handleOriginSelect}
                colorPalette="blue"
              />
            </Field.Root>

            {/* Stops */}
            {form.stops.map((stop, index) => (
              <Field.Root key={index}>
                <Field.Label>Stop {index + 1}</Field.Label>
                <HStack>
                  <LocationComboBox
                    placeholder={`Stop ${index + 1}`}
                    value={stop.name}
                    onSelect={(loc) => updateStop(index, loc)}
                    // colorPalette="blue"
                  />
                  <IconButton
                    aria-label="Remove stop"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    flexShrink={0}
                    onClick={() => removeStop(index)}
                  >
                    <LuX />
                  </IconButton>
                </HStack>
              </Field.Root>
            ))}

            <Button
              variant="ghost"
              colorPalette="blue"
              size="sm"
              alignSelf="flex-start"
              onClick={addStop}
            >
              <LuPlus /> Add a stop
            </Button>

            <Field.Root required>
              <Field.Label>To</Field.Label>
              <LocationComboBox
                placeholder="Where to?"
                value={form.destination}
                onSelect={handleDestinationSelect}
                colorPalette="blue"
              />
            </Field.Root>

            <Field.Root required>
              <Field.Label>Pickup Point</Field.Label>
              <LocationComboBox
                placeholder="Where should passengers meet you?"
                value={form.pickup_point}
                onSelect={handlePickupSelect}
                colorPalette="blue"
              />
            </Field.Root>
          </VStack>
        </Box>

        {/* Date & time */}
        <Box bg="bg.panel" borderRadius="2xl" p={5} shadow="md">
          <Text fontWeight="700" mb={4}>
            Date & Time
          </Text>
          <DateCalendar />
        </Box>

        {/* Ride details */}
        <Box bg="bg.panel" borderRadius="2xl" p={5} shadow="md">
          <Text fontWeight="700" mb={4}>
            Ride Details
          </Text>
          <VStack gap={4} align="stretch">
            <HStack>
              <Field.Root required>
                <Field.Label>Car Model</Field.Label>
                <Input
                  value={form.car_model}
                  onChange={(e) => set({ car_model: e.target.value })}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>License Plate</Field.Label>
                <Input
                  value={form.license_plate}
                  onChange={(e) => set({ license_plate: e.target.value })}
                />
              </Field.Root>
            </HStack>
            <HStack>
              <Field.Root required>
                <Field.Label>Available Seats</Field.Label>
                <NumberInput.Root
                  min={1}
                  max={30}
                  value={form.available_seats.toString()}
                  onValueChange={(d) =>
                    set({ available_seats: parseInt(d.value) || 1 })
                  }
                  colorPalette="blue"
                  width="full"
                >
                  <NumberInput.Control />
                  <NumberInput.Input />
                </NumberInput.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>Price/seat (RWF)</Field.Label>
                <NumberInput.Root
                  min={1000}
                  value={form.price_per_seat.toString()}
                  onValueChange={(d) =>
                    set({ price_per_seat: parseInt(d.value) || 0 })
                  }
                  colorPalette="blue"
                  width="full"
                >
                  <NumberInput.Control />
                  <NumberInput.Input />
                </NumberInput.Root>
                {priceNum > 0 && (
                  <Field.HelperText fontSize="xs" color="fg.muted">
                    10% fee and free cashout. You earn{" "}
                    {driverEarns.toLocaleString()} RWF/seat.
                  </Field.HelperText>
                )}
              </Field.Root>
            </HStack>
          </VStack>
        </Box>

        <Button
          colorPalette="blue"
          size="lg"
          borderRadius="2xl"
          loading={saving}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </VStack>
    </Flex>
  );
};
