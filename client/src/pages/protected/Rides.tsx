import { Empty, Header } from "@/components/common";
import { RideItem } from "./RideItem";
import type { Ride } from "@/context/ride-context";
import { useRide } from "@/context/ride-context";
import { baseUrl } from "@/main";
import {
  Alert,
  Badge,
  Box,
  Center,
  Heading,
  HStack,
  Icon,
  Skeleton,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { LuCar, LuShieldAlert, LuTicket } from "react-icons/lu";
import { useLocation, useNavigate, useSearchParams } from "react-router";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const Rides = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = searchParams.get("tab") ?? "posted";
  const { isRideBooked } = useRide();

  const [postedRides, setPostedRides] = useState<Ride[]>([]);
  const [bookedRides, setBookedRides] = useState<Ride[]>([]);
  const [loadingPosted, setLoadingPosted] = useState(true);
  const [loadingBooked, setLoadingBooked] = useState(true);

  const fetchData = () => {
    setLoadingPosted(true);
    setLoadingBooked(true);
    axios
      .get<Ride[]>(`${baseUrl}/rides/my-posted/`, authHeader())
      .then((res) => setPostedRides(res.data))
      .finally(() => setLoadingPosted(false));

    axios
      .get<Ride[]>(`${baseUrl}/rides/my-booked/`, authHeader())
      .then((res) => setBookedRides(res.data))
      .finally(() => setLoadingBooked(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.refresh]);

  const pendingCount = postedRides.filter(
    (r) => r.status === "pending_review",
  ).length;

  return (
    <>
      <Header>
        <Heading>My Rides</Heading>
      </Header>

      <Tabs.Root defaultValue={defaultTab} variant="enclosed" size="sm">
        <Center>
          <Tabs.List w="85%" h={10}>
            <Tabs.Trigger value="posted" w="1/2" h="100%">
              <LuCar />
              Posted
              {pendingCount > 0 && (
                <Badge
                  colorPalette="orange"
                  variant="solid"
                  borderRadius="full"
                  ml={1}
                  px={1.5}
                  fontSize="2xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="booked" w="1/2" h="100%">
              <LuTicket />
              Booked
            </Tabs.Trigger>
          </Tabs.List>
        </Center>

        <Tabs.Content value="posted">
          {loadingPosted ? (
            <RideSkeletons />
          ) : postedRides.length === 0 ? (
            <Empty
              title="No rides posted yet"
              desc="The rides you post will appear under this tab"
              icon={<LuCar />}
            />
          ) : (
            <VStack px={4} pt={4}>
              {postedRides.map((ride) => (
                <Box key={ride.id} w="full">
                  {ride.status === "pending_review" && (
                    <Alert.Root
                      status="warning"
                      variant="surface"
                      borderRadius="xl"
                      mb={2}
                      py={2}
                    >
                      <Alert.Indicator>
                        <LuShieldAlert />
                      </Alert.Indicator>
                      <Alert.Title fontSize="xs" flex={1}>
                        This ride is under review and not visible to passengers
                        until identity is verified.
                      </Alert.Title>
                    </Alert.Root>
                  )}
                  <RideItem
                    ride={ride}
                    isOwnRide
                    onClick={() => navigate(`/rides/${ride.id}`)}
                  />
                </Box>
              ))}
            </VStack>
          )}
        </Tabs.Content>

        <Tabs.Content value="booked">
          {loadingBooked ? (
            <RideSkeletons />
          ) : bookedRides.length === 0 ? (
            <Empty
              title="You haven't booked any ride yet"
              desc="The rides you book will appear under this tab"
              icon={<LuTicket />}
            />
          ) : (
            <VStack px={4} pt={4}>
              {bookedRides.map((ride) => (
                <RideItem
                  key={ride.id}
                  ride={ride}
                  isOwnRide={false}
                  onClick={() => navigate(`/rides/${ride.id}`)}
                />
              ))}
            </VStack>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
};

const RideSkeletons = () => (
  <VStack px={4} pt={4}>
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} w="full" h="180px" borderRadius="2xl" />
    ))}
  </VStack>
);
