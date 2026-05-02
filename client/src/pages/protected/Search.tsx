import { Empty, Header, LocationComboBox } from "@/components/common";
import { FilterDrawer } from "@/components/overlays";
import { RideContext, type Ride } from "@/context/ride-context";
import type { LocationOption } from "@/types/location";
import { DEFAULT_FILTERS, type SearchFilters } from "@/types/search";
import {
  Badge,
  Container,
  Heading,
  HStack,
  IconButton,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSearch, LuSettings2, LuX } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router";
import { baseUrl } from "@/main";
import { RideItem } from "./RideItem";

export const Search = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rideContext = useContext(RideContext);

  const [fromLocation, setFromLocation] = useState<LocationOption | null>(
    () => {
      const name = searchParams.get("origin");
      return name
        ? {
            id: "",
            name,
            district: "",
            province: "",
            latitude: 0,
            longitude: 0,
          }
        : null;
    },
  );
  const [toLocation, setToLocation] = useState<LocationOption | null>(() => {
    const name = searchParams.get("destination");
    return name
      ? { id: "", name, district: "", province: "", latitude: 0, longitude: 0 }
      : null;
  });

  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] =
    useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = async (
    from: LocationOption | null,
    to: LocationOption | null,
    activeFilters: SearchFilters,
  ) => {
    // if (!from?.name && !to?.name) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (from?.name) params.set("origin", from.name);
      if (to?.name) params.set("destination", to.name);
      if (activeFilters.date) params.set("date", activeFilters.date);
      if (activeFilters.seats > 1)
        params.set("seats", String(activeFilters.seats));
      if (activeFilters.time) params.set("time", activeFilters.time);
      if (activeFilters.sort) params.set("sort", activeFilters.sort);

      console.log("params", params);
      const res = await axios.get<Ride[]>(
        `${baseUrl}/rides/search/?${params.toString()}`,
        { signal: abortRef.current.signal },
      );
      setResults(res.data);
    } catch (err) {
      if (!axios.isCancel(err)) setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when location changes
  useEffect(() => {
    runSearch(fromLocation, toLocation, filters);
  }, [fromLocation, toLocation]);

  // Auto-search on mount if params pre-filled from HomeSearch
  useEffect(() => {
    if (fromLocation || toLocation) {
      runSearch(fromLocation, toLocation, filters);
    }
  }, []);

  const handleApplyFilters = (applied: SearchFilters) => {
    setFilters(applied);
    setShowFilter(false);
    runSearch(fromLocation, toLocation, applied);
  };

  const handleClearFilter = (key: keyof SearchFilters) => {
    const updated = { ...filters, [key]: DEFAULT_FILTERS[key] };
    setFilters(updated);
    runSearch(fromLocation, toLocation, updated);
  };

  const activeFilterCount = [
    filters.date !== "",
    filters.seats > 1,
    filters.time !== "",
    filters.sort !== "",
  ].filter(Boolean).length;

  const FILTER_LABELS: Record<string, string> = {
    today: "Today",
    week: "This week",
    month: "This month",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    price_asc: "Price ↑",
    price_desc: "Price ↓",
  };

  return (
    <Container direction="column">
      <VStack gap={3}>
        <Header>
          <Heading>{t("searchPage.header")}</Heading>
        </Header>

        <HStack w="full">
          <LocationComboBox
            placeholder={t("homePage.placeholders.from")}
            value={fromLocation?.name ?? ""}
            onSelect={setFromLocation}
          />
          <LocationComboBox
            placeholder={t("homePage.placeholders.to")}
            value={toLocation?.name ?? ""}
            onSelect={setToLocation}
          />
          <IconButton
            variant="outline"
            position="relative"
            onClick={() => setShowFilter(true)}
          >
            <LuSettings2 />
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorPalette="blue"
                borderRadius="full"
                fontSize="2xs"
                minW="4"
                h="4"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </IconButton>
        </HStack>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <HStack w="full" gap={2} flexWrap="wrap">
            {filters.date && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                cursor="pointer"
                onClick={() => handleClearFilter("date")}
              >
                {FILTER_LABELS[filters.date]} <LuX size={11} />
              </Badge>
            )}
            {filters.time && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                cursor="pointer"
                onClick={() => handleClearFilter("time")}
              >
                {FILTER_LABELS[filters.time]} <LuX size={11} />
              </Badge>
            )}
            {filters.seats > 1 && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                cursor="pointer"
                onClick={() => handleClearFilter("seats")}
              >
                {filters.seats}+ seats <LuX size={11} />
              </Badge>
            )}
            {filters.sort && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                cursor="pointer"
                onClick={() => handleClearFilter("sort")}
              >
                {FILTER_LABELS[filters.sort]} <LuX size={11} />
              </Badge>
            )}
          </HStack>
        )}
      </VStack>

      <VStack gap={3} mt={4}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} w="full" h="180px" borderRadius="2xl" />
          ))
        ) : !hasSearched ? (
          <Empty
            icon={<LuSearch />}
            title="Search for a ride"
            desc="Enter your origin or destination to find available rides"
          />
        ) : results.length > 0 ? (
          <>
            <Text textStyle="sm" color="fg.subtle" alignSelf="start">
              {results.length} ride{results.length !== 1 ? "s" : ""} found
            </Text>
            {results.map((ride) => (
              <RideItem
                key={ride.id}
                ride={ride}
                isBooked={rideContext?.isRideBooked(ride.id) ?? false}
                onClick={() => navigate(`/rides/${ride.id}`)}
              />
            ))}
          </>
        ) : (
          <Empty
            icon={<LuSearch />}
            title="No rides found"
            desc="Try a different origin, destination or adjust your filters"
          />
        )}
      </VStack>

      <FilterDrawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        filters={pendingFilters}
        onFiltersChange={setPendingFilters}
        onApply={handleApplyFilters}
        onReset={() => {
          setPendingFilters(DEFAULT_FILTERS);
          setFilters(DEFAULT_FILTERS);
          setShowFilter(false);
          runSearch(fromLocation, toLocation, DEFAULT_FILTERS);
        }}
      />
    </Container>
  );
};
