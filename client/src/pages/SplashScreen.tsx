import { Container, Flex, Image, Spinner } from "@chakra-ui/react";
import logo from "@/assets/pamojaLogo.svg";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/signin"), 5000);
  }, [navigate]);

  return (
    <Container bg={"dodgerblue"} h={"100vh"}>
      <Flex
        flex={1}
        alignItems={"center"}
        justifyContent={"center"}
        minH={"90%"}
        direction={"column"}
        gapY={10}
      >
        <Image src={logo} />

        <Spinner size="sm" />
      </Flex>
    </Container>
  );
};
