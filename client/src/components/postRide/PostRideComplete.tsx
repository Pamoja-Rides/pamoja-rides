import { Heading, Icon, Text, VStack } from "@chakra-ui/react";
import { LuCircleCheckBig } from "react-icons/lu";

export const PostRideComplete = () => {
  return (
    <>
      <VStack
        h={"50vh"}
        alignItems={"center"}
        justifyContent={"center"}
        rowGap={10}
      >
        <Icon size={"2xl"} color={"blue.solid"}>
          <LuCircleCheckBig />
        </Icon>
        <Heading color={"blue.focusRing"}>Success</Heading>
        <Text textAlign={"center"} color={"fg.muted"}>
          Your ride was submitted successfully for review. You will get a
          notification once it's approved by the admin{" "}
        </Text>
      </VStack>
    </>
  );
};
