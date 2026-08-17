import { Container, HStack } from "@chakra-ui/react";
import { Utilities } from "./Utilities";
import type { ReactElement } from "react";

export const Header = ({ children }: { children: ReactElement }) => {
  return (
    <Container marginBlock={10} bg={"bg"} zIndex={1000}>
      <HStack w={"full"} justifyContent={"space-between"}>
        {children}
        <Utilities />
      </HStack>
    </Container>
  );
};
