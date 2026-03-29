import { Button, Circle, Input, InputGroup, Stack } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { DateCalendar } from "../common";

export const HomeSearch = () => {
  const { t } = useTranslation();
  const originDot = "blue.500";
  const destDot = "orange.500";
  return (
    <Stack
      bg="bg.panel"
      borderRadius="3xl"
      p={{ base: 6, md: 8 }}
      shadow="lg"
      gap={6}
      align="stretch"
    >
      <InputGroup
        startElement={<Circle size={3} bg={originDot} ml={1} />}
        colorPalette={"blue"}
      >
        <Input
          placeholder={t("homePage.placeholders.from")}
          size={"md"}
          p={6}
        />
      </InputGroup>

      <InputGroup
        startElement={<Circle size={3} bg={destDot} ml={1} />}
        colorPalette={"blue"}
      >
        <Input placeholder={t("homePage.placeholders.to")} size={"md"} p={6} />
      </InputGroup>

      <DateCalendar />

      <Button
        size="lg"
        colorPalette="blue"
        borderRadius="xl"
        width="full"
        justifyContent="center"
        gap={3}
      >
        <LuSearch size={18} />
        {t("homePage.searchBtn")}
      </Button>
    </Stack>
  );
};
