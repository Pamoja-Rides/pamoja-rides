import { ColorModeButton } from "@/components/ui/color-mode";
import {
  Box,
  Button,
  Circle,
  Container,
  DatePicker,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuSearch, LuLogOut, LuCalendar } from "react-icons/lu";
import logoIc from "@/assets/logoIc.svg";
import { LanguageSelection } from "./languageSelect/LanguageSelection";
import { useNavigate } from "react-router";

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mainBlue = "blue.600";
  const originDot = "blue.500";
  const destDot = "orange.500";

  return (
    <Box position="relative">
      <Box
        bg={mainBlue}
        color="white"
        pt={16}
        pb={32}
        textAlign="center"
        borderRadius="none"
      >
        <Container maxW="container.md">
          <Flex justify="space-between" align="center" mb={12}>
            <Box>
              <Image src={logoIc} />
            </Box>

            <HStack>
              <ColorModeButton color={"white"} />
              <LanguageSelection />
              <IconButton
                variant={"ghost"}
                color={"white"}
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/signin");
                }}
              >
                <LuLogOut />
              </IconButton>
            </HStack>
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

      <Container maxW="container.md" position="relative" mt={-16}>
        <Stack
          bg="bg.panel"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          shadow="lg"
          gap={6}
          align="stretch"
        >
          <InputGroup
            startElement={<Circle size={3} bg={originDot} ml={1} />}
            colorPalette={"blue"}
          >
            <Input
              placeholder={t("homePage.placeholders.from")}
              size={"md"}
              p={6}
            />
          </InputGroup>

          <InputGroup
            startElement={<Circle size={3} bg={destDot} ml={1} />}
            colorPalette={"blue"}
          >
            <Input
              placeholder={t("homePage.placeholders.to")}
              size={"md"}
              p={6}
            />
          </InputGroup>

          <DatePicker.Root colorPalette={"blue"}>
            <DatePicker.Control>
              <DatePicker.IndicatorGroup>
                <DatePicker.Trigger>
                  <LuCalendar />
                </DatePicker.Trigger>
              </DatePicker.IndicatorGroup>
              <DatePicker.Input
                p={6}
                placeholder={t("homePage.placeholders.when")}
              />
            </DatePicker.Control>
            <Portal>
              <DatePicker.Positioner>
                <DatePicker.Content>
                  <DatePicker.View view="day">
                    <DatePicker.Header />
                    <DatePicker.DayTable />
                  </DatePicker.View>
                  <DatePicker.View view="month">
                    <DatePicker.Header />
                    <DatePicker.MonthTable />
                  </DatePicker.View>
                  <DatePicker.View view="year">
                    <DatePicker.Header />
                    <DatePicker.YearTable />
                  </DatePicker.View>
                </DatePicker.Content>
              </DatePicker.Positioner>
            </Portal>
          </DatePicker.Root>

          <Button
            size="lg"
            colorPalette="blue"
            borderRadius="xl"
            width="full"
            justifyContent="center"
            gap={3}
          >
            <LuSearch size={18} />
            {t("homePage.searchBtn")}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
