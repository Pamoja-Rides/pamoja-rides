import { PostRideContext } from "@/context/postRide-context";
import { Flex, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import { useContext } from "react";
import { LuMapPin } from "react-icons/lu";
import { LocationComboBox } from "../common";
import { truncateText } from "@/utils/truncateText";
import axios from "axios";

export const RouteDetails = () => {
  const context = useContext(PostRideContext);
  if (!context) return null;
  const { formData, setFormData } = context;

  return (
    <>
      <VStack h={"100%"} mt={5}>
        <VStack>
          <Icon as={LuMapPin} color={"fg.muted"} size={"lg"} />
          <Heading>Route details</Heading>
          <Text color={"fg.muted"} fontWeight={"light"} textStyle={"sm"}>
            Set the route details
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
          <HStack>
            <LocationComboBox
              placeholder="From"
              value={truncateText(formData.origin, 5)}
              onSelect={async (loc) => {
                try {
                  const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/location-details/?place_id=${loc.id}`,
                  );
                  const { latitude, longitude } = response.data;

                  setFormData({
                    ...formData,
                    origin: loc.name,
                    origin_lat: latitude,
                    origin_lng: longitude,
                  });
                } catch (error) {
                  console.error("Failed to fetch location details:", error);
                }
              }}
            />

            <LocationComboBox
              placeholder="To"
              value={formData.destination}
              onSelect={async (loc) => {
                try {
                  const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/location-details/?place_id=${loc.id}`,
                  );
                  const { latitude, longitude } = response.data;

                  setFormData({
                    ...formData,
                    destination: loc.name,
                    destination_lat: latitude,
                    destination_lng: longitude,
                  });
                } catch (error) {
                  console.error("Failed to fetch location details:", error);
                }
              }}
            />
          </HStack>
          <LocationComboBox
            placeholder="Where should you meet with passengers"
            value={formData.pickup_point}
            onSelect={(loc) => {
              setFormData({
                ...formData,
                pickup_point: loc.name,
                pickup_lat: loc.latitude,
                pickup_lng: loc.longitude,
              });
            }}
          />
        </Flex>
      </VStack>
    </>
  );
};
