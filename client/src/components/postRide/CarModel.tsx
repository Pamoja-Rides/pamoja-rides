"use client";

import {
  Combobox,
  Image,
  Portal,
  Span,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";

export const CarModelInput = ({
  onSelect,
}: {
  onSelect: (model: string) => void;
  value: string;
}) => {
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection, filter } = useListCollection({
    initialItems: items,
    filter: contains,
  });

  return (
    <Combobox.Root
      collection={collection}
      onInputValueChange={(e) => filter(e.inputValue)}
      onValueChange={(model) => {
        const selected = collection.items.find(
          (item) => item.value === model.value[0],
        );
        if (selected?.value) {
          onSelect(selected.value);
        }
      }}
      width="full"
      closeOnSelect
    >
      <Combobox.Control>
        <Combobox.Input placeholder="Example: Audi" />
        <Combobox.IndicatorGroup>
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No items found</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.value}>
                <Image boxSize="5" src={item.logo} alt={item.label + " logo"} />
                <Span flex="1">{item.label}</Span>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
};

const items = [
  {
    label: "Audi",
    value: "audi",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/audi-logo.png",
  },
  {
    label: "BMW",
    value: "bmw",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/bmw-logo.png",
  },
  {
    label: "Citroen",
    value: "citroen",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/citroen-logo.png",
  },
  {
    label: "Dacia",
    value: "dacia",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/dacia-logo.png",
  },
  {
    label: "Fiat",
    value: "fiat",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/fiat-logo.png",
  },
  {
    label: "Ford",
    value: "ford",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/ford-logo.png",
  },
  {
    label: "Ferrari",
    value: "ferrari",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/ferrari-logo.png",
  },
  {
    label: "Honda",
    value: "honda",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/honda-logo.png",
  },
  {
    label: "Hyundai",
    value: "hyundai",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/hyundai-logo.png",
  },
  {
    label: "Jaguar",
    value: "jaguar",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/jaguar-logo.png",
  },
  {
    label: "Jeep",
    value: "jeep",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/jeep-logo.png",
  },
  {
    label: "Kia",
    value: "kia",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/kia-logo.png",
  },
  {
    label: "Land Rover",
    value: "land rover",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/land-rover-logo.png",
  },
  {
    label: "Mazda",
    value: "mazda",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/mazda-logo.png",
  },
  {
    label: "Mercedes",
    value: "mercedes",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/mercedes-logo.png",
  },
  {
    label: "Mini",
    value: "mini",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/mini-logo.png",
  },
  {
    label: "Mitsubishi",
    value: "mitsubishi",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/mitsubishi-logo.png",
  },
  {
    label: "Nissan",
    value: "nissan",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/nissan-logo.png",
  },
  {
    label: "Opel",
    value: "opel",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/opel-logo.png",
  },
  {
    label: "Peugeot",
    value: "peugeot",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/peugeot-logo.png",
  },
  {
    label: "Porsche",
    value: "porsche",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/porsche-logo.png",
  },
  {
    label: "Renault",
    value: "renault",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/renault-logo.png",
  },
  {
    label: "Saab",
    value: "saab",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/saab-logo.png",
  },
  {
    label: "Skoda",
    value: "skoda",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/skoda-logo.png",
  },
  {
    label: "Subaru",
    value: "subaru",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/subaru-logo.png",
  },
  {
    label: "Suzuki",
    value: "suzuki",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/suzuki-logo.png",
  },
  {
    label: "Toyota",
    value: "toyota",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/toyota-logo.png",
  },
  {
    label: "Volkswagen",
    value: "volkswagen",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/volkswagen-logo.png",
  },
  {
    label: "Volvo",
    value: "volvo",
    logo: "https://s3.amazonaws.com/cdn.formk.it/example-assets/car-brands/volvo-logo.png",
  },
];
