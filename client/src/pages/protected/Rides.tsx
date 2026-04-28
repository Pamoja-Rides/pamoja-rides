import { Empty, Header } from "@/components/common";
import { RideItem } from "./RideItem";
import type { Ride } from "@/context/ride-context";
import { baseUrl } from "@/main";
import { Center, Heading, Skeleton, Tabs, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { LuCar, LuTicket } from "react-icons/lu";
import { useNavigate } from "react-router";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const Rides = () => {
  const navigate = useNavigate();

  const [postedRides, setPostedRides] = useState<Ride[]>([]);
  const [bookedRides, setBookedRides] = useState<Ride[]>([]);
  const [loadingPosted, setLoadingPosted] = useState(true);
  const [loadingBooked, setLoadingBooked] = useState(true);

  useEffect(() => {
    axios
      .get<Ride[]>(`${baseUrl}/rides/my-posted/`, authHeader())
      .then((res) => setPostedRides(res.data))
      .finally(() => setLoadingPosted(false));

    axios
      .get<Ride[]>(`${baseUrl}/rides/my-booked/`, authHeader())
      .then((res) => setBookedRides(res.data))
      .finally(() => setLoadingBooked(false));
  }, []);

  return (
    <>
      <Header>
        <Heading>My Rides</Heading>
      </Header>

      <Tabs.Root defaultValue="posted" variant="enclosed" size="sm">
        <Center>
          <Tabs.List w="85%" h={10}>
            <Tabs.Trigger value="posted" w="1/2" h="100%">
              <LuCar />
              Posted
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
                <RideItem
                  key={ride.id}
                  ride={ride}
                  isOwnRide={true}
                  onClick={() => navigate(`/rides/${ride.id}`)}
                />
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
