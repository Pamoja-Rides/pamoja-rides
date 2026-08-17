import { PostRideContext, type StopData } from "@/context/postRide-context";
import {
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
import type { LocationOption, LocationPlace } from "@/types/location";
import axios from "axios";
import { baseUrl } from "@/main";
import { fixCoord } from "@/utils/fixCoords";

export const RouteDetails = () => {
  const context = useContext(PostRideContext);
  if (!context) return null;
  const { formData, setFormData } = context;

  const handleGetCoords = async (
    loc: LocationPlace,
    newFormDataKey: string,
  ) => {
    try {
      // Fetch coordinates using the id (place_id)
      const response = await axios.get(
        `${baseUrl}/location-details/?place_id=${loc.id}`,
      );
      const { latitude, longitude } = response.data;

      const keyOptions: Record<
        string,
        Record<string, number | string | StopData>
      > = {
        origin: {
          origin: loc.name,
          origin_lat: fixCoord(latitude),
          origin_lng: fixCoord(longitude),
        },
        destination: {
          destination: loc.name,
          destination_lat: fixCoord(latitude),
          destination_lng: fixCoord(longitude),
        },
        pickUp: {
          pickup_point: loc.name,
          pickup_lat: fixCoord(latitude),
          pickup_lng: fixCoord(longitude),
        },
      };

      setFormData({
        ...formData,
        ...keyOptions[newFormDataKey],
      });
    } catch (error) {
      console.error("Failed to fetch location details:", error);
    }
  };

  const handleOriginSelect = (loc: LocationPlace) =>
    handleGetCoords(loc, "origin");

  const handleDestinationSelect = (loc: LocationPlace) =>
    handleGetCoords(loc, "destination");

  const handlePickupSelect = (loc: LocationPlace) =>
    handleGetCoords(loc, "pickUp");

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
        {/* Origin */}
        <Field.Root required>
          <Field.Label>
            From <Field.RequiredIndicator />
          </Field.Label>
          <Flex align="center" gap={3} w="full">
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
