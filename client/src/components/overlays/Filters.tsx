import {
  Badge,
  Button,
  Grid,
  Heading,
  HStack,
  NumberInput,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuArrowDownUp } from "react-icons/lu";
import type {
  SearchFilters,
  DateFilter,
  TimeFilter,
  SortOption,
} from "@/types/search";

interface FiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export const Filters = ({ filters, onChange }: FiltersProps) => {
  const { t } = useTranslation();
  const set = (patch: Partial<SearchFilters>) =>
    onChange({ ...filters, ...patch });

  const dateOptions: { label: string; value: DateFilter }[] = [
    { label: t("filters.today"), value: "today" },
    { label: t("filters.thisWeek"), value: "week" },
    { label: t("filters.thisMonth"), value: "month" },
  ];

  const timeOptions: { label: string; value: TimeFilter; sub: string }[] = [
    { label: "Morning", value: "morning", sub: "05:00 – 11:59" },
    { label: "Afternoon", value: "afternoon", sub: "12:00 – 16:59" },
    { label: "Evening", value: "evening", sub: "17:00 – 23:59" },
  ];

  const sortOptions: { label: string; value: SortOption; icon: string }[] = [
    { label: "Price: Low to High", value: "price_asc", icon: "↑" },
    { label: "Price: High to Low", value: "price_desc", icon: "↓" },
  ];

  return (
    <VStack align="stretch" gap={0}>
      {/* Departure date */}
      <Heading size="sm" mb={3}>
        {t("filters.departureDate")}
      </Heading>
      <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={5}>
        {dateOptions.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            borderRadius={8}
            variant={filters.date === opt.value ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() =>
              set({ date: filters.date === opt.value ? "" : opt.value })
            }
          >
            {opt.label}
          </Button>
        ))}
      </Grid>

      <Separator mb={5} />

      {/* Departure time */}
      <Heading size="sm" mb={3}>
        Departure Time
      </Heading>
      <VStack gap={2} mb={5} align="stretch">
        {timeOptions.map((opt) => (
          <HStack
            key={opt.value}
            px={4}
            py={3}
            borderRadius="xl"
            borderWidth={1}
            borderColor={filters.time === opt.value ? "blue.400" : "border"}
            bg={filters.time === opt.value ? "blue.50" : "transparent"}
            _dark={{
              bg: filters.time === opt.value ? "blue.950" : "transparent",
            }}
            cursor="pointer"
            justify="space-between"
            onClick={() =>
              set({ time: filters.time === opt.value ? "" : opt.value })
            }
          >
            <Text fontWeight="500" fontSize="sm">
              {opt.label}
            </Text>
            <HStack gap={2}>
              <Text fontSize="xs" color="fg.muted">
                {opt.sub}
              </Text>
              {filters.time === opt.value && (
                <Badge
                  colorPalette="blue"
                  variant="solid"
                  borderRadius="full"
                  px={2}
                  fontSize="2xs"
                >
                  ✓
                </Badge>
              )}
            </HStack>
          </HStack>
        ))}
      </VStack>

      <Separator mb={5} />

      {/* Seats */}
      <HStack justify="space-between" mb={5}>
        <Text fontWeight="medium">{t("filters.seatsFilter")}</Text>
        <NumberInput.Root
          min={1}
          max={8}
          width="110px"
          value={String(filters.seats)}
          onValueChange={(details) =>
            set({ seats: parseInt(details.value) || 1 })
          }
          colorPalette="blue"
        >
          <NumberInput.Control />
          <NumberInput.Input />
        </NumberInput.Root>
      </HStack>

      <Separator mb={5} />

      {/* Sort by price */}
      <HStack mb={3}>
        <LuArrowDownUp size={16} />
        <Heading size="sm">Sort by Price</Heading>
      </HStack>
      <VStack gap={2} align="stretch">
        {sortOptions.map((opt) => (
          <HStack
            key={opt.value}
            px={4}
            py={3}
            borderRadius="xl"
            borderWidth={1}
            borderColor={filters.sort === opt.value ? "blue.400" : "border"}
            bg={filters.sort === opt.value ? "blue.50" : "transparent"}
            _dark={{
              bg: filters.sort === opt.value ? "blue.950" : "transparent",
            }}
            cursor="pointer"
            justify="space-between"
            onClick={() =>
              set({ sort: filters.sort === opt.value ? "" : opt.value })
            }
          >
            <Text fontWeight="500" fontSize="sm">
              {opt.label}
            </Text>
            {filters.sort === opt.value && (
              <Badge
                colorPalette="blue"
                variant="solid"
                borderRadius="full"
                px={2}
                fontSize="2xs"
              >
                ✓
              </Badge>
            )}
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};
