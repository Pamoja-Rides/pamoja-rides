import {
  Combobox,
  Portal,
  useFilter,
  useListCollection,
  InputGroup,
  Spinner,
  Box,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import axios from "axios";
import type { LocationOption } from "@/types/location";

type LocationItem = {
  label: string;
  value: string;
  raw: LocationOption;
};

interface Props {
  placeholder: string;
  value: string;
  onSelect: (location: LocationOption) => void;
  startElement?: React.ReactNode;
}

export const LocationComboBox = ({
  placeholder,
  onSelect,
  startElement,
}: Props) => {
  const { contains } = useFilter({ sensitivity: "base" });

  const [loading, setLoading] = useState(false);

  const { collection, set } = useListCollection<LocationItem>({
    initialItems: [],
    filter: contains,
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLocations = async (q: string) => {
    if (!q) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/locations/?q=${q}`,
      );

      // transform API → Combobox format
      const formatted = res.data.map((item: LocationOption) => ({
        label: item.name,
        value: item.id,
        raw: item,
      }));

      set(formatted);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Combobox.Root
      collection={collection}
      onInputValueChange={(e) => {
        const value = e.inputValue;

        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() => {
          fetchLocations(value);
        }, 300);
      }}
      onValueChange={(details) => {
        const selected = collection.items.find(
          (item) => item.value === details.value[0],
        );

        if (selected?.raw) {
          onSelect(selected.raw);
        }
      }}
      width="100%"
      colorPalette={"blue"}
    >
      <Combobox.Label />

      <Combobox.Control>
        <InputGroup startElement={startElement}>
          <Combobox.Input placeholder={placeholder} p={3} />
        </InputGroup>

        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>

        {loading && (
          <Box position="absolute" right="10px" top="10px">
            <Spinner size="sm" />
          </Box>
        )}
      </Combobox.Control>

      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No locations found</Combobox.Empty>

            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.value}>
                {item.label}
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
};
