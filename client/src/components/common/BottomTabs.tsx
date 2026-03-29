import { Box, Flex, Grid, Icon, Menu, Portal } from "@chakra-ui/react";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  LuCar,
  LuCirclePlus,
  LuCoins,
  LuHouse,
  LuSearch,
  LuUser,
} from "react-icons/lu";
import { NavLink } from "react-router";

export const BottomTabs = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const getAnchorRect = () => ref.current!.getBoundingClientRect();

  const tabs = [
    { icon: <LuHouse />, text: "Home", path: "/" },
    { icon: <LuSearch />, text: "Search", path: "/search" },
    { icon: <LuCirclePlus />, text: "Post", path: "/post" },
    { icon: <LuCar />, text: "Rides", path: "/rides" },
    { icon: <LuUser />, text: "Account" },
  ];
  return (
    <Box position={"relative"}>
      <Grid
        templateColumns="repeat(5, 1fr)"
        gap="6"
        position={"fixed"}
        bottom={0}
        paddingBlock={3}
        w={"full"}
        bg={"bg.panel"}
        maxW={"768px"}
        left={"50%"}
        transform={"translateX(-50%)"}
      >
        {tabs.map((item) =>
          item.path ? (
            <NavLink to={item.path} key={item.text} end>
              {({ isActive }) => (
                <TabItem tabItem={item} isActiveLink={isActive} />
              )}
            </NavLink>
          ) : (
            <Box
              key={item.text}
              ref={ref}
              onClick={() => setMenuOpen(true)}
              cursor="pointer"
            >
              <TabItem tabItem={item} isActiveLink={false} />
            </Box>
          ),
        )}
        <AccountMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          getAnchorRect={getAnchorRect}
        />
      </Grid>
    </Box>
  );
};

const TabItem = ({
  tabItem,
  isActiveLink,
}: {
  tabItem: { icon: ReactNode; text: string };
  isActiveLink: boolean;
}) => (
  <>
    <Flex
      bg={isActiveLink ? "blue.emphasized" : "transparent"}
      p={3}
      marginInline={"10%"}
      borderRadius={"full"}
      justifyContent={"center"}
    >
      <Icon>{tabItem.icon}</Icon>
    </Flex>
  </>
);

const AccountMenu = ({
  open,
  onOpenChange,
  getAnchorRect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getAnchorRect: () => DOMRect;
}) => {
  const { t } = useTranslation();

  return (
    <Menu.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      positioning={{ getAnchorRect, placement: "top" }}
    >
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="cut">
              <LuCoins />
              <Box flex="1">{t("bottomTabs.accountMenu.payments")}</Box>
            </Menu.Item>
            <Menu.Item value="copy">
              <LuUser />
              <Box flex="1">{t("bottomTabs.accountMenu.profile")}</Box>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
