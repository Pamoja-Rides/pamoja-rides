import {
  Combobox,
  Portal,
  useFilter,
  useListCollection,
  InputGroup,
  Spinner,
  Box,
} from "@chakra-ui/react";
import { useRef, useState, type ReactNode } from "react";
import axios from "axios";
import type { LocationOption } from "@/types/location";

type LocationItem = {
  label: string;
  value: string;
  raw: LocationOption;
};

interface LocationComboBoxProps {
  placeholder: string;
  value: string;
  onSelect: (location: LocationOption) => void;
  onInputChange?: (value: string) => void;
  startElement?: ReactNode;
  colorPalette?: string;
}

export const LocationComboBox = ({
  placeholder,
  value,
  onSelect,
  onInputChange,
  startElement,
  colorPalette = "blue",
}: LocationComboBoxProps) => {
  const { contains } = useFilter({ sensitivity: "base" });
  const [loading, setLoading] = useState(false);
  const { collection, set } = useListCollection<LocationItem>({
    initialItems: [],
    filter: contains,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLocations = async (q: string) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/locations/?q=${encodeURIComponent(q)}`,
      );
      const formatted = res.data.map((item: LocationOption) => ({
        label: item.name,
        value: item.id,
        raw: item,
      }));
      set(formatted);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <Combobox.Root
      collection={collection}
      inputValue={value}
      onInputValueChange={(e) => {
        const val = e.inputValue;

        // Notify parent of every keystroke — powers search-as-you-type
        onInputChange?.(val);

        if (timer.current) clearTimeout(timer.current);

        if (!val.trim()) {
          set([]);
          return;
        }

        timer.current = setTimeout(() => {
          fetchLocations(val);
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
      colorPalette={colorPalette}
    >
      <Combobox.Label />
      <Combobox.Control>
        <InputGroup startElement={startElement} w="full">
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
