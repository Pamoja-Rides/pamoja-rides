import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import logoIc from "@/assets/logoIc.svg";
import { HomeSearch } from "@/components/home/HomeSearch";
import { Empty, Utilities } from "@/components/common";
import { LuMapPin, LuSquareDashedMousePointer } from "react-icons/lu";
import { useContext, useEffect, useMemo, useState } from "react";
import { RideContext, type Ride } from "@/context/ride-context";
import { RideItem } from "./RideItem";
import { useNavigate } from "react-router";

interface Coords {
  lat: number;
  lng: number;
}

const haversineKm = (a: Coords, b: Coords): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const NEAR_ME_RADIUS_KM = 50;

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rideContext = useContext(RideContext);
  const rides = rideContext?.rides ?? [];
  const bookedRideIds = rideContext?.bookedRideIds ?? new Set<string>();

  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationDenied(true);
        setLocationLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  const nearbyRides = useMemo<Ride[]>(() => {
    // Always exclude booked rides
    const unbooked = rides;

    if (!userCoords) return unbooked;

    return unbooked
      .filter((r) => {
        if (!r.origin_lat || !r.origin_lng) return true; // no coords → always show
        const dist = haversineKm(userCoords, {
          lat: Number(r.origin_lat),
          lng: Number(r.origin_lng),
        });
        return dist <= NEAR_ME_RADIUS_KM;
      })
      .sort((a, b) => {
        if (!a.origin_lat || !b.origin_lat) return 0;
        const da = haversineKm(userCoords, {
          lat: Number(a.origin_lat),
          lng: Number(a.origin_lng),
        });
        const db = haversineKm(userCoords, {
          lat: Number(b.origin_lat),
          lng: Number(b.origin_lng),
        });
        return da - db;
      });
  }, [rides, userCoords, bookedRideIds]);

  const sectionTitle = locationDenied
    ? "Available Rides"
    : userCoords
      ? "Available Rides Near Me"
      : "Available Rides";

  return (
    <Box position="relative">
      <Box bg="blue.600" color="white" pt={10} pb={32} textAlign="center">
        <Container maxW="container.md">
          <Flex justify="space-between" align="center" mb={12}>
            <Box>
              <Image src={logoIc} />
            </Box>
            <Utilities color="white" />
          </Flex>
          <Stack gap={3} align="center">
            <Heading size="3xl" fontWeight="bold">
              {t("homePage.heroText")}
            </Heading>
            <Text textStyle="sm" opacity={0.9} maxW="md">
              {t("homePage.heroSubText")}
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container maxW="container.md" position="relative" mt={-20}>
        <HomeSearch />

        {locationLoading ? (
          <Stack gap={4}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} h="180px" borderRadius="2xl" />
            ))}
          </Stack>
        ) : nearbyRides.length === 0 ? (
          <Empty
            icon={
              locationDenied ? <LuSquareDashedMousePointer /> : <LuMapPin />
            }
            title={
              locationDenied ? t("homePage.empty.title") : "No rides near you"
            }
            desc={
              locationDenied
                ? t("homePage.empty.description")
                : "There are no rides starting within 50km of your location"
            }
          />
        ) : (
          <>
            <Flex align="center" gap={2} mb={5}>
              <Heading size="md">{sectionTitle}</Heading>
              {userCoords && !locationDenied && (
                <Text fontSize="xs" color="fg.muted">
                  · within 50km
                </Text>
              )}
            </Flex>
            {nearbyRides.map((ride) => (
              <RideItem
                key={ride.id}
                ride={ride}
                onClick={() => navigate(`/rides/${ride.id}`)}
              />
            ))}
          </>
        )}
      </Container>
    </Box>
  );
};
