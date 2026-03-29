import { Empty, Utilities } from "@/components/common";
import { FilterDrawer } from "@/components/overlays";
import {
  Container,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuSearch,
  LuSettings2,
  LuSquareDashedMousePointer,
} from "react-icons/lu";

export const Search = () => {
  const { t } = useTranslation();

  const [showFilter, setShowFilter] = useState(false);

  const emptyStateProps = {
    icon: <LuSquareDashedMousePointer />,
    title: t("homePage.empty.title"),
    desc: t("homePage.empty.description"),
  };

  return (
    <Container position={"relative"} direction={"column"} marginTop={5}>
      <VStack>
        <HStack w={"full"} justifyContent={"space-between"}>
          <Heading>{t("searchPage.header")}</Heading>
          <Utilities />
        </HStack>
        <HStack>
          <Field.Root colorPalette={"blue"}>
            <InputGroup startElement={<LuSearch />}>
              <Input placeholder={t("homePage.placeholders.from")} />
            </InputGroup>
          </Field.Root>
          <Field.Root colorPalette={"blue"}>
            <InputGroup startElement={<LuSearch />}>
              <Input placeholder={t("homePage.placeholders.to")} />
            </InputGroup>
          </Field.Root>
          <IconButton variant={"outline"} onClick={() => setShowFilter(true)}>
            <LuSettings2 />
          </IconButton>
          <FilterDrawer
            open={showFilter}
            onClose={() => setShowFilter(false)}
          />
        </HStack>
      </VStack>
      <Flex>
        <Empty {...emptyStateProps} />
      </Flex>
    </Container>
  );
};
