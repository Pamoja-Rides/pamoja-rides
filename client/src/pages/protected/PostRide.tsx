import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Separator,
  Steps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuCar, LuCheck, LuClock, LuMapPin, LuUser } from "react-icons/lu";
import { Header } from "@/components/common";
import {
  DateTime,
  DriverDetails,
  RideDetails,
  RouteDetails,
} from "@/components/postRide";
import { PostRideProvider } from "@/context/PostRideProvider";
import { PostRideContext, type PostRideData } from "@/context/postRide-context";
import { RideContext } from "@/context/ride-context";

const steps = [
  {
    icon: <LuMapPin />,
    title: "Route",
    content: <RouteDetails />,
    validate: (data: PostRideData | undefined) =>
      data?.origin && data.destination && data.pickup_point,
  },
  {
    icon: <LuClock />,
    title: "Date and Time",
    content: <DateTime />,
    validate: (data: PostRideData | undefined) => data?.departure_datetime,
  },
  {
    icon: <LuCar />,
    title: "Ride details",
    content: <RideDetails />,
    validate: (data: PostRideData | undefined) =>
      data?.car_model && data?.available_seats > 0 && data?.price_per_seat > 0,
  },
  {
    icon: <LuUser />,
    title: "Driver details",
    content: <DriverDetails />,
    validate: (data: PostRideData | undefined) =>
      data?.nid_number &&
      data?.full_name_on_id &&
      data?.nid_image_url &&
      data?.license_image_url &&
      data?.license_number &&
      data?.driver_phone &&
      data?.ai_verified_same_person === true, // ← blocks Next/Review if mismatch
  },
];

export const PostRide = () => (
  <PostRideProvider>
    <PostRideInner />
  </PostRideProvider>
);

const PostRideInner = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<{
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: { step: number; action: string; targetStep?: any };
  } | null>(null);

  const postRideContext = useContext(PostRideContext);
  const rideContext = useContext(RideContext);
  const wsError = rideContext?.wsError;

  // Listen for RIDE_POSTED confirmation from WS
  useEffect(() => {
    if (submitted) {
      // Navigate to rides page — pass refresh signal via state
      navigate("/rides?tab=posted", { state: { refresh: true } });
    }
  }, [submitted, navigate]);

  const handleFinalSubmit = () => {
    if (!postRideContext || !rideContext) return;
    const { formData } = postRideContext;
    setSubmitting(true);

    rideContext.sendWSMessage("post_ride", {
      origin: formData.origin,
      origin_lat: formData.origin_lat ?? null,
      origin_lng: formData.origin_lng ?? null,
      stops: formData.stops
        .filter((s) => s.name.trim() !== "")
        .map((s, index) => ({
          name: s.name,
          lat: s.lat ?? null,
          lng: s.lng ?? null,
          order: index,
        })),
      destination: formData.destination,
      destination_lat: formData.destination_lat ?? null,
      destination_lng: formData.destination_lng ?? null,
      pickup_point: formData.pickup_point,
      pickup_lat: formData.pickup_lat ?? null,
      pickup_lng: formData.pickup_lng ?? null,
      departure_datetime: formData.departure_datetime,
      car_model: formData.car_model,
      license_plate: formData.license_plate,
      available_seats: formData.available_seats,
      price_per_seat: formData.price_per_seat,
      nid_number: formData.nid_number,
      license_number: formData.license_number,
      full_name_on_id: formData.full_name_on_id,
      nid_image_url: formData.nid_image_url,
      license_image_url: formData.license_image_url,
      ai_verified_same_person: formData.ai_verified_same_person,
      ai_confidence: formData.ai_confidence,
      ai_nid_name: formData.ai_nid_name,
      ai_license_name: formData.ai_license_name,
      identity_flag: formData.identity_flag,
      identity_flag_reason: formData.identity_flag_reason,
    });

    // WS is fire-and-forget — wait briefly then navigate
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  useEffect(() => {
    if (error) setTimeout(() => setError(null), 3000);
  }, [error]);

  const formData = postRideContext?.formData;

  const departureLabel = formData?.departure_datetime
    ? new Date(formData.departure_datetime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

  const priceNum = Number(formData?.price_per_seat) || 0;
  const commission = Math.round(priceNum * 0.05);
  const driverEarns = priceNum - commission;

  return (
    <Flex direction="column" h="100vh">
      <Header>
        <Heading>Post your ride</Heading>
      </Header>

      {wsError && (
        <Alert.Root status="error" variant="surface" mx={5} mb={2} w="fit">
          <Alert.Indicator />
          <Alert.Title flex={1}>{wsError}</Alert.Title>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={rideContext?.clearError}
          >
            Dismiss
          </Button>
        </Alert.Root>
      )}

      <Flex paddingInline={5} h="90%">
        <Steps.Root
          step={step}
          onStepChange={(e) => setStep(e.step)}
          count={steps.length}
          size="xs"
          colorPalette="blue"
          variant="subtle"
          h="100%"
          linear
          onStepInvalid={(details) => {
            setError({
              message: `Step ${details.step + 1} is invalid`,
              details,
            });
          }}
          isStepValid={(index) =>
            steps[index].validate(postRideContext?.formData) ? true : false
          }
        >
          <Steps.List>
            {steps.map((s, index) => (
              <Steps.Item key={index} index={index}>
                <Steps.Indicator
                  color={error?.details?.step === index ? "fg.error" : ""}
                  bg={error?.details?.step === index ? "bg.error" : ""}
                  borderWidth={1}
                  borderColor={error?.details?.step === index ? "red.800" : ""}
                >
                  <Steps.Status incomplete={s.icon} complete={<LuCheck />} />
                </Steps.Indicator>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>

          {steps.map((s, index) => (
            <Steps.Content key={index} index={index} minH="30vh">
              {error && (
                <Alert.Root
                  status="error"
                  variant="surface"
                  borderStartWidth="3px"
                  borderStartColor="colorPalette.600"
                  my={5}
                >
                  <Alert.Indicator />
                  <Alert.Title>{error.message}</Alert.Title>
                </Alert.Root>
              )}
              {s.content}
            </Steps.Content>
          ))}

          {/* Summary step — shown after all 4 steps complete */}
          <Steps.CompletedContent>
            <VStack gap={4} mt={4} align="stretch">
              <Heading size="md">Review your ride</Heading>
              <Text fontSize="sm" color="fg.muted">
                Check the details below before posting.
              </Text>

              {/* Identity flag warning */}
              {formData?.identity_flag && (
                <Alert.Root
                  status="warning"
                  variant="surface"
                  borderRadius="xl"
                >
                  <Alert.Indicator />
                  <Alert.Title fontSize="sm" flex={1}>
                    Identity issue detected — this ride will not be visible to
                    passengers until your identity documents are reviewed by our
                    team.
                  </Alert.Title>
                </Alert.Root>
              )}

              {/* Route */}
              <Box bg="bg.panel" borderRadius="2xl" p={5}>
                <Text fontWeight="700" mb={3}>
                  Route
                </Text>
                <VStack align="start" gap={2}>
                  <HStack gap={2}>
                    <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
                    <Text fontSize="sm">{formData?.origin || "—"}</Text>
                  </HStack>
                  {formData?.stops
                    ?.filter((s) => s.name)
                    .map((stop, i) => (
                      <HStack key={i} gap={2} pl={1}>
                        <Box
                          w="6px"
                          h="6px"
                          borderWidth={1}
                          borderColor="blue.300"
                          borderRadius="full"
                        />
                        <Text fontSize="sm" color="fg.muted">
                          {stop.name}
                        </Text>
                      </HStack>
                    ))}
                  <HStack gap={2}>
                    <Box w="8px" h="8px" bg="orange.500" borderRadius="full" />
                    <Text fontSize="sm">{formData?.destination || "—"}</Text>
                  </HStack>
                </VStack>
                <Separator mt={3} mb={3} />
                <Text fontSize="xs" color="fg.muted">
                  Pickup: {formData?.pickup_point || "—"}
                </Text>
              </Box>

              {/* Ride info */}
              <Box bg="bg.panel" borderRadius="2xl" p={5}>
                <Text fontWeight="700" mb={3}>
                  Ride Info
                </Text>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      Departure
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {departureLabel}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      Car
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {formData?.car_model} · {formData?.license_plate}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      Seats available
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {formData?.available_seats}
                    </Text>
                  </HStack>
                  <Separator />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      Price per seat
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {priceNum.toLocaleString()} RWF
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="fg.subtle">
                      Platform fee (5%)
                    </Text>
                    <Text fontSize="xs" color="fg.subtle">
                      - {commission.toLocaleString()} RWF
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="700" color="green.600">
                      You earn per seat
                    </Text>
                    <Text fontSize="sm" fontWeight="700" color="green.600">
                      {driverEarns.toLocaleString()} RWF
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Driver identity */}
              <Box bg="bg.panel" borderRadius="2xl" p={5}>
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="700">Identity</Text>
                  <Badge
                    colorPalette={formData?.identity_flag ? "orange" : "green"}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                  >
                    {formData?.identity_flag ? "Pending review" : "Verified"}
                  </Badge>
                </HStack>
                <VStack align="stretch" gap={1}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      Name on ID
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {formData?.full_name_on_id || "—"}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      NID Number
                    </Text>
                    <Text fontSize="sm" fontFamily="mono">
                      {formData?.nid_number || "—"}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="fg.muted">
                      License Number
                    </Text>
                    <Text fontSize="sm" fontFamily="mono">
                      {formData?.license_number || "—"}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              <Button
                colorPalette="blue"
                size="lg"
                borderRadius="2xl"
                loading={submitting}
                onClick={handleFinalSubmit}
              >
                {formData?.identity_flag
                  ? "Post Ride (Pending Review)"
                  : "Confirm & Post Ride"}
              </Button>
            </VStack>
          </Steps.CompletedContent>

          <ButtonGroup size="sm" variant="outline" mt="5vh" mb={"5vh"}>
            <Steps.PrevTrigger asChild>
              <Button>Prev</Button>
            </Steps.PrevTrigger>
            {step < steps.length - 1 && (
              <Steps.NextTrigger asChild>
                <Button variant="solid">Next</Button>
              </Steps.NextTrigger>
            )}
            {step === steps.length - 1 && (
              <Steps.NextTrigger asChild>
                <Button variant="solid">Review</Button>
              </Steps.NextTrigger>
            )}
          </ButtonGroup>
        </Steps.Root>
      </Flex>
    </Flex>
  );
};
