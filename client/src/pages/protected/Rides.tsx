import { Empty, Header } from "@/components/common";
import { Center, Heading, Tabs } from "@chakra-ui/react";
import { LuCar, LuTicket } from "react-icons/lu";

export const Rides = () => {
  return (
    <>
      <Header>
        <Heading>My Rides</Heading>
      </Header>
      <Tabs.Root defaultValue="posted" variant={"enclosed"} size={"sm"}>
        <Center>
          <Tabs.List w={"85%"} h={10}>
            <Tabs.Trigger value="posted" w={"1/2"} h={"100%"}>
              <LuCar />
              Posted
            </Tabs.Trigger>
            <Tabs.Trigger value="booked" w={"1/2"} h={"100%"}>
              <LuTicket />
              Booked
            </Tabs.Trigger>
          </Tabs.List>
        </Center>
        <Tabs.Content value="posted">
          <Empty
            title="No rides posted yet"
            desc="The rides you post will appeard under this tab"
            icon={<LuCar />}
          />
        </Tabs.Content>
        <Tabs.Content value="booked">
          <Empty
            title="You haven't booked any ride yet"
            desc="The rides you book will appear under this tab"
            icon={<LuTicket />}
          />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
};
