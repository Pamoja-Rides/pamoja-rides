import { Box, Button, Center, Drawer, Portal } from "@chakra-ui/react";
import { Filters } from "./Filters";
import { useTranslation } from "react-i18next";

export const FilterDrawer = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Drawer.Root
      open={open}
      placement={"bottom"}
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content borderTopRadius={20}>
            <Center pt="3" pb="1">
              <Box
                width="40px"
                height="4px"
                bg="gray.300"
                borderRadius="full"
              />
            </Center>
            <Drawer.Header>
              <Drawer.Title>{t("filterDrawer.title")}:</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Filters />
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="outline" colorPalette={"blue"}>
                {t("filterDrawer.resetBtn")}
              </Button>
              <Button colorPalette={"blue"}>
                {t("filterDrawer.applyBtn")}
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
