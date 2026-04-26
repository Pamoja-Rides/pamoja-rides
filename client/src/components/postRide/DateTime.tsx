import { Flex, Heading, Icon, Text, VStack } from "@chakra-ui/react";
import { LuClockArrowUp } from "react-icons/lu";
import { DateCalendar } from "../common";

export const DateTime = () => {
  return (
    <>
      <VStack mt={5} h="100%" rowGap={5}>
        <VStack>
          <Icon as={LuClockArrowUp} color={"fg.muted"} size={"lg"} />
          <Heading>Date & Time</Heading>
          <Text color={"fg.muted"} fontWeight={"light"} textStyle={"sm"}>
            Set the date and time of the ride
          </Text>
        </VStack>
        <Flex
          w={"full"}
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
          <DateCalendar />
        </Flex>
      </VStack>
    </>
  );
};
