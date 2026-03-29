import {
  Box,
  Container,
  EmptyState,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import logoIc from "@/assets/logoIc.svg";
import { HomeSearch } from "@/components/home/HomeSearch";
import { Utilities } from "@/components/common";
import { LuSquareDashedMousePointer } from "react-icons/lu";

export const Home = () => {
  const { t } = useTranslation();
  const mainBlue = "blue.600";

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

              <Utilities />
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
          <EmptyState.Root size={"sm"}>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <LuSquareDashedMousePointer />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>{t("homePage.empty.title")}</EmptyState.Title>
                <EmptyState.Description>
                  {t("homePage.empty.description")}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        </Container>
      </Box>
    </>
  );
};
