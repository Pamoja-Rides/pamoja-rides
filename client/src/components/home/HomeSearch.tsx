import { Button, Circle, Stack } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { DateCalendar, LocationComboBox } from "../common";
import { useState } from "react";
import type { LocationOption } from "@/types/location";

export const HomeSearch = () => {
  const { t } = useTranslation();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // optional: if you want coordinates later
  const [fromLocation, setFromLocation] = useState<LocationOption | null>(null);
  const [toLocation, setToLocation] = useState<LocationOption | null>(null);

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
        value={from}
        startElement={<Circle size={3} bg="blue.500" ml={1} />}
        onSelect={(loc) => {
          setFrom(loc.name);
          setFromLocation(loc);
        }}
      />

      <LocationComboBox
        placeholder={t("homePage.placeholders.to")}
        value={to}
        startElement={<Circle size={3} bg="orange.500" ml={1} />}
        onSelect={(loc) => {
          setTo(loc.name);
          setToLocation(loc);
        }}
      />

      <DateCalendar />

      <Button
        size="lg"
        colorPalette="blue"
        borderRadius="xl"
        width="full"
        justifyContent="center"
        gap={3}
        onClick={() => console.log("location", fromLocation, toLocation)}
      >
        <LuSearch size={18} />
        {t("homePage.searchBtn")}
      </Button>
    </Stack>
  );
};
