import { Button, Circle, Stack } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { DateCalendar, LocationComboBox } from "../common";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { LocationOption } from "@/types/location";

export const HomeSearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fromLocation, setFromLocation] = useState<LocationOption | null>(null);
  const [toLocation, setToLocation] = useState<LocationOption | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (fromLocation?.name) params.set("origin", fromLocation.name);
    if (toLocation?.name) params.set("destination", toLocation.name);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Stack
      bg="bg.panel"
      borderRadius="3xl"
      p={{ base: 6, md: 8 }}
      shadow="lg"
      gap={6}
      align="stretch"
      mb={5}
    >
      <LocationComboBox
        placeholder={t("homePage.placeholders.from")}
        value={fromLocation?.name ?? ""}
        startElement={<Circle size={3} bg="blue.500" ml={1} />}
        onSelect={setFromLocation}
      />
      <LocationComboBox
        placeholder={t("homePage.placeholders.to")}
        value={toLocation?.name ?? ""}
        startElement={<Circle size={3} bg="orange.500" ml={1} />}
        onSelect={setToLocation}
      />
      <DateCalendar />
      <Button
        size="lg"
        colorPalette="blue"
        borderRadius="xl"
        width="full"
        justifyContent="center"
        gap={3}
        onClick={handleSearch}
      >
        <LuSearch size={18} />
        {t("homePage.searchBtn")}
      </Button>
    </Stack>
  );
};
