import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Steps,
} from "@chakra-ui/react";
import { LuCar, LuCheck, LuClock, LuMapPin, LuUser } from "react-icons/lu";
import { Header } from "@/components/common";
import {
  DateTime,
  DriverDetails,
  PostRideComplete,
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
      data?.driver_phone,
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
  const [error, setError] = useState<{
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: { step: number; action: string; targetStep?: any };
  } | null>(null);
  const postRideContext = useContext(PostRideContext);
  const rideContext = useContext(RideContext);
  const wsError = rideContext?.wsError;

  const handleSubmit = () => {
    if (!postRideContext || !rideContext) return;
    const { formData } = postRideContext;

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
    });

    navigate("/rides");
  };

  useEffect(() => {
    if (error) setTimeout(() => setError(null), 3000);
  }, [error]);

  return (
    <Flex direction="column" minH="10vh">
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

          <Steps.CompletedContent>
            <PostRideComplete />
          </Steps.CompletedContent>

          <ButtonGroup size="sm" variant="outline" mt="5vh" mb={5}>
            <Steps.PrevTrigger asChild>
              <Button>Prev</Button>
            </Steps.PrevTrigger>
            {step < steps.length - 1 && (
              <Steps.NextTrigger asChild>
                <Button variant="solid">Next</Button>
              </Steps.NextTrigger>
            )}
            {step === steps.length - 1 && (
              <Button variant="solid" onClick={handleSubmit}>
                Submit
              </Button>
            )}
            {step === steps.length && (
              <Button variant="solid" onClick={() => navigate("/rides")}>
                See my rides
              </Button>
            )}
          </ButtonGroup>
        </Steps.Root>
      </Flex>
    </Flex>
  );
};
