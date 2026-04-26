import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Separator,
  Slider,
  VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTags } from "react-icons/lu";
import { LocationComboBox, SeatSelector } from "../common";
import { useState } from "react";

export const Filters = () => {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const marks = [
    { value: 0, label: "1000" },
    { value: 50, label: "5000" },
    { value: 100, label: "10000" },
  ];
  return (
    <>
      <Heading size={"sm"}>{t("filters.departureDate")}</Heading>
      <VStack rowGap={5} marginBlock={5}>
        <HStack w={"full"}>
          <LocationComboBox
            placeholder={t("homePage.placeholders.from")}
            value={from}
            onSelect={(loc) => setFrom(loc.name)}
          />

          <LocationComboBox
            placeholder={t("homePage.placeholders.to")}
            value={to}
            onSelect={(loc) => setTo(loc.name)}
          />
        </HStack>
        <Grid templateColumns="repeat(3, 1fr)" gap="7">
          <Button borderRadius={5} variant={"outline"}>
            {t("filters.today")}
          </Button>
          <Button borderRadius={5} variant={"outline"}>
            {t("filters.thisWeek")}
          </Button>
          <Button borderRadius={5} variant={"outline"}>
            {t("filters.thisMonth")}
          </Button>
        </Grid>
      </VStack>
      <Separator />
      <VStack marginBlock={5} alignItems={"flex-start"}>
        <SeatSelector title={t("filters.seatsFilter")} />
      </VStack>
      <Separator />
      <Slider.Root
        width="full"
        colorPalette="blue"
        defaultValue={[40]}
        marginBlock={5}
      >
        <HStack justify="space-between">
          <Slider.Label>{t("filters.priceTitle")}</Slider.Label>
          <Slider.ValueText />
        </HStack>
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb index={0} boxSize={6} borderColor="blue">
            <Box colorPalette={"blue"} as={LuTags} />
          </Slider.Thumb>
          <Slider.Marks marks={marks} />
        </Slider.Control>
      </Slider.Root>
    </>
  );
};
