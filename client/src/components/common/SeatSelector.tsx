import {
  createListCollection,
  Grid,
  Heading,
  HStack,
  IconButton,
  Portal,
  RatingGroup,
  Select,
  Text,
  useSelectContext,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuArmchair } from "react-icons/lu";

export const SeatSelector = ({ title }: { title: string }) => {
  const { t } = useTranslation();
  const [selectedSeatNumber, setSelectedSeatNumber] = useState(5);

  return (
    <>
      <Heading size={"sm"}>{title}</Heading>
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
                  <RatingGroup.ItemIndicator icon={<LuArmchair />} />
                </RatingGroup.Item>
              ))}
            </Grid>
          </RatingGroup.Control>
        </RatingGroup.Root>

        <Select.Root
          positioning={{ sameWidth: false }}
          collection={seats}
          size="sm"
          defaultValue={["1"]}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <SelectTrigger />
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content minW="32">
                {seats.items.map((seat) => (
                  <Select.Item item={seat} key={seat}>
                    <Text>{seat}</Text>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </HStack>
    </>
  );
};

const seats = createListCollection({
  items: Array.from({ length: 5 }).map((_, index) => index + 1),
});
const SelectTrigger = () => {
  const { t } = useTranslation();
  const [selectedSeatNumber, setSelectedSeatNumber] = useState(5);
  const { selectedItems, value, getTriggerProps } = useSelectContext();
  // useEffect(() => {
  //   i18n.changeLanguage(value[0]);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [value]);
  return (
    <IconButton px="2" variant="ghost" size="sm" {...getTriggerProps()}>
      <Text textStyle={"md"} fontWeight={"medium"} color={"blue.solid"}>
        {selectedSeatNumber} {t("filters.seats")}
      </Text>
    </IconButton>
  );
};
