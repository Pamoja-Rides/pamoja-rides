import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import logoIc from "@/assets/logoIc.svg";
import { HomeSearch } from "@/components/home/HomeSearch";
import { Empty, Utilities } from "@/components/common";
import { LuSquareDashedMousePointer } from "react-icons/lu";

export const Home = () => {
  const { t } = useTranslation();
  const mainBlue = "blue.600";

  const emptyStateProps = {
    icon: <LuSquareDashedMousePointer />,
    title: t("homePage.empty.title"),
    desc: t("homePage.empty.description"),
  };

  return (
    <>
      <Box position="relative">
        <Box
          bg={mainBlue}
          color="white"
          pt={10}
          pb={32}
          textAlign="center"
          borderRadius="none"
        >
          <Container maxW="container.md">
            <Flex justify="space-between" align="center" mb={12}>
              <Box>
                <Image src={logoIc} />
              </Box>

              <Utilities color="white" />
            </Flex>

            <Stack gap={3} align="center">
              <Heading size="3xl" fontWeight="bold">
                {t("homePage.heroText")}
              </Heading>
              <Text textStyle="sm" opacity={0.9} maxW="md">
                {t("homePage.heroSubText")}
              </Text>
            </Stack>
          </Container>
        </Box>
        <Container maxW="container.md" position="relative" mt={-16} gap={20}>
          <HomeSearch />
          <Empty {...emptyStateProps} />
        </Container>
      </Box>
    </>
  );
};
