import { Empty, Header, LocationComboBox } from "@/components/common";
import { FilterDrawer } from "@/components/overlays";
import { RideContext, type Ride } from "@/context/ride-context";
import {
  Container,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSearch, LuSettings2 } from "react-icons/lu";
import { RideItem } from "./RideItem";

export const Search = () => {
  const { t } = useTranslation();
  const rideContext = useContext(RideContext);
  const allRides = rideContext?.rides ?? [];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const filtered: Ride[] = allRides.filter((ride) => {
    const matchFrom =
      from.trim() === "" ||
      ride.origin.toLowerCase().includes(from.toLowerCase());
    const matchTo =
      to.trim() === "" ||
      ride.destination.toLowerCase().includes(to.toLowerCase());
    return matchFrom && matchTo;
  });

  return (
    <Container direction="column">
      <VStack>
        <Header>
          <Heading>{t("searchPage.header")}</Heading>
        </Header>
        <HStack w="full">
          <LocationComboBox
            placeholder="From"
            value={from}
            onSelect={(loc) => {
              setFrom(loc.name);
            }}
          />

          <LocationComboBox
            placeholder="To"
            value={to}
            onSelect={(loc) => {
              setTo(loc.name);
            }}
          />
          <IconButton variant="outline" onClick={() => setShowFilter(true)}>
            <LuSettings2 />
          </IconButton>
          <FilterDrawer
            open={showFilter}
            onClose={() => setShowFilter(false)}
          />
        </HStack>
      </VStack>

      <VStack gap={3} mt={4}>
        {filtered.length > 0 ? (
          <>
            <Text textStyle={"sm"} color={"fg.subtle"} alignSelf={"start"}>
              {filtered.length} rides found
            </Text>
            {filtered.map((rideItem) => (
              <RideItem key={rideItem.id} ride={rideItem} />
            ))}
          </>
        ) : (
          <Empty
            icon={<LuSearch />}
            title="No rides found"
            desc="Try different origin or destination"
          />
        )}
      </VStack>
    </Container>
  );
};
