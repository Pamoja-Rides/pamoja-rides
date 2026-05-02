import { Box, Button, Center, Drawer, Portal } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Filters } from "./Filters";
import type { SearchFilters } from "@/types/search";
import { DEFAULT_FILTERS } from "@/types/search";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: (filters: SearchFilters) => void;
  onReset: () => void;
}

export const FilterDrawer = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: FilterDrawerProps) => {
  const { t } = useTranslation();

  return (
    <Drawer.Root
      open={open}
      placement="bottom"
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content borderTopRadius={20} maxH="90vh">
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
            <Drawer.Body overflowY="auto">
              <Filters filters={filters} onChange={onFiltersChange} />
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="outline" colorPalette="blue" onClick={onReset}>
                {t("filterDrawer.resetBtn")}
              </Button>
              <Button colorPalette="blue" onClick={() => onApply(filters)}>
                {t("filterDrawer.applyBtn")}
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
