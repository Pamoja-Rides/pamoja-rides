import {
  Box,
  Button,
  Field,
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  RatingGroup,
  Separator,
  Slider,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSearch, LuTags, LuUsers } from "react-icons/lu";

export const Filters = () => {
  const { t } = useTranslation();
  const [selectedSeatNumber, setSelectedSeatNumber] = useState(1);

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
          <Field.Root colorPalette={"blue"}>
            <InputGroup startElement={<LuSearch />}>
              <Input placeholder={t("homePage.placeholders.from")} />
            </InputGroup>
          </Field.Root>
          <Field.Root colorPalette={"blue"}>
            <InputGroup startElement={<LuSearch />}>
              <Input placeholder={t("homePage.placeholders.to")} />
            </InputGroup>
          </Field.Root>
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
        <Heading size={"sm"}>{t("filters.seatsFilter")}</Heading>
        <HStack w={"full"} justifyContent={"space-between"}>
          <RatingGroup.Root
            count={5}
            defaultValue={selectedSeatNumber}
            colorPalette="blue"
            onValueChange={({ value }) => setSelectedSeatNumber(value)}
          >
            <RatingGroup.HiddenInput />
            <RatingGroup.Control>
              <Grid templateColumns="repeat(5, 1fr)" gapX={10}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <RatingGroup.Item key={index} index={index + 1}>
                    <RatingGroup.ItemIndicator icon={<LuUsers />} />
                  </RatingGroup.Item>
                ))}
              </Grid>
            </RatingGroup.Control>
          </RatingGroup.Root>
          <Text textStyle={"md"} fontWeight={"medium"} color={"blue.solid"}>
            {selectedSeatNumber} {t("filters.seats")}
          </Text>
        </HStack>
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
