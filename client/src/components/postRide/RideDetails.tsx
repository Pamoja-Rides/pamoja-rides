import { PostRideContext } from "@/context/postRide-context";
import {
  Field,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext } from "react";
import { LuCar } from "react-icons/lu";
import { CarModelInput } from "./CarModel";

export const RideDetails = () => {
  const context = useContext(PostRideContext);
  if (!context) return null;
  const { formData, setFormData } = context;

  return (
    <>
      <VStack marginBlock={5} rowGap={5}>
        <VStack>
          <Icon as={LuCar} color={"fg.muted"} size={"lg"} />
          <Heading>Ride details</Heading>
          <Text color={"fg.muted"} fontWeight={"light"} textStyle={"sm"}>
            Set the ride details
          </Text>
        </VStack>
        <Flex
          direction={"column"}
          flex={1}
          rowGap={5}
          padding="5"
          alignItems={"center"}
          justifyContent={"center"}
          borderWidth={1}
          rounded={10}
          mt={5}
        >
          <HStack w={"full"}>
            <Field.Root required>
              <Field.Label>
                Car Model <Field.RequiredIndicator />
              </Field.Label>
              <CarModelInput
                value={formData.car_model}
                onSelect={(model) =>
                  setFormData({ ...formData, car_model: model })
                }
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>License Plate</Field.Label>
              <Input
                placeholder="Enter license plate"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData({ ...formData, license_plate: e.target.value })
                }
              />
            </Field.Root>
          </HStack>
          <HStack>
            <Field.Root required>
              <Field.Label>
                Available seats <Field.RequiredIndicator />
              </Field.Label>
              <NumberInput.Root
                width="full"
                defaultValue="2"
                min={2}
                max={30}
                value={formData.available_seats.toString()}
                onValueChange={(details) =>
                  setFormData({
                    ...formData,
                    available_seats: parseInt(details.value),
                  })
                }
              >
                <NumberInput.Control />
                <NumberInput.Input />
              </NumberInput.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Price/seat</Field.Label>
              <NumberInput.Root
                width="full"
                value={formData.price_per_seat.toString()}
                onValueChange={(details) =>
                  setFormData({
                    ...formData,
                    price_per_seat: parseFloat(details.value),
                  })
                }
              >
                <NumberInput.Control />
                <NumberInput.Input />
              </NumberInput.Root>
            </Field.Root>
          </HStack>
        </Flex>
      </VStack>
    </>
  );
};
