import { PostRideContext } from "@/context/postRide-context";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Icon,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext } from "react";
import { LuMapPin, LuPlus, LuX } from "react-icons/lu";
import { LocationComboBox } from "../common";
import type { LocationOption } from "@/types/location";

export const RouteDetails = () => {
  const context = useContext(PostRideContext);
  if (!context) return null;
  const { formData, setFormData } = context;

  const handleOriginSelect = (loc: LocationOption) => {
    setFormData((prev) => ({
      ...prev,
      origin: loc.name,
      origin_lat: loc.latitude,
      origin_lng: loc.longitude,
    }));
  };

  const handleDestinationSelect = (loc: LocationOption) => {
    setFormData((prev) => ({
      ...prev,
      destination: loc.name,
      destination_lat: loc.latitude,
      destination_lng: loc.longitude,
    }));
  };

  const handlePickupSelect = (loc: LocationOption) => {
    setFormData((prev) => ({
      ...prev,
      pickup_point: loc.name,
      pickup_lat: loc.latitude,
      pickup_lng: loc.longitude,
    }));
  };

  const addStop = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, { name: "", lat: null, lng: null }],
    }));
  };

  const removeStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const updateStop = (index: number, loc: LocationOption) => {
    setFormData((prev) => {
      const stops = [...prev.stops];
      stops[index] = { name: loc.name, lat: loc.latitude, lng: loc.longitude };
      return { ...prev, stops };
    });
  };

  return (
    <VStack h="100%" mt={5} w="full">
      <VStack>
        <Icon as={LuMapPin} color="fg.muted" size="lg" />
        <Heading>Route details</Heading>
        <Text color="fg.muted" fontWeight="light" textStyle="sm">
          Set your route and any stops along the way
        </Text>
      </VStack>

      <Flex
        direction="column"
        rowGap={4}
        padding="5"
        borderWidth={1}
        rounded={10}
        mt={5}
        w="full"
        position="relative"
      >
        {/* Visual route line */}
        {/* <Box
          position="absolute"
          left="32px"
          top="52px"
          bottom="52px"
          w="2px"
          bg="blue.100"
          zIndex={0}
        /> */}

        {/* Origin */}
        <Field.Root required>
          <Field.Label>
            From <Field.RequiredIndicator />
          </Field.Label>
          <Flex align="center" gap={3} w="full">
            {/* <Box
              w="12px"
              h="12px"
              borderRadius="full"
              bg="blue.500"
              flexShrink={0}
              zIndex={1}
            /> */}
            <LocationComboBox
              placeholder="Where from?"
              value={formData.origin}
              onSelect={handleOriginSelect}
            />
          </Flex>
        </Field.Root>

        {/* Intermediate stops */}
        {formData.stops.map((stop, index) => (
          <Field.Root key={index}>
            <Field.Label>Stop {index + 1}</Field.Label>
            <Flex align="center" gap={3} w="full">
              {/* <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg="blue.300"
                flexShrink={0}
                zIndex={1}
              /> */}
              <LocationComboBox
                placeholder={`Stop ${index + 1}`}
                value={stop.name}
                onSelect={(loc) => updateStop(index, loc)}
              />
              <IconButton
                aria-label="Remove stop"
                size="sm"
                variant="ghost"
                colorPalette="red"
                flexShrink={0}
                onClick={() => removeStop(index)}
              >
                <LuX />
              </IconButton>
            </Flex>
          </Field.Root>
        ))}

        {/* Add stop button */}
        <Button
          variant="ghost"
          colorPalette="blue"
          size="sm"
          alignSelf="flex-start"
          ml="28px"
          onClick={addStop}
          disabled={!formData.origin}
        >
          <LuPlus />
          Add a stop
        </Button>

        {/* Destination */}
        <Field.Root required>
          <Field.Label>
            To <Field.RequiredIndicator />
          </Field.Label>
          <Flex align="center" gap={3} w="full">
            {/* <Box
              w="12px"
              h="12px"
              borderRadius="full"
              bg="orange.500"
              flexShrink={0}
              zIndex={1}
            /> */}
            <LocationComboBox
              placeholder="Where to?"
              value={formData.destination}
              onSelect={handleDestinationSelect}
            />
          </Flex>
        </Field.Root>

        {/* Pickup point */}
        <Field.Root required>
          <Field.Label>
            Pickup Point <Field.RequiredIndicator />
          </Field.Label>
          <LocationComboBox
            placeholder="Where should passengers meet you?"
            value={formData.pickup_point}
            onSelect={handlePickupSelect}
          />
        </Field.Root>
      </Flex>
    </VStack>
  );
};
