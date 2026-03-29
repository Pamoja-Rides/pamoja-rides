import { EmptyState, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const Empty = ({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) => {
  return (
    <EmptyState.Root size={"sm"}>
      <EmptyState.Content>
        <EmptyState.Indicator>{icon}</EmptyState.Indicator>
        <VStack textAlign="center">
          <EmptyState.Title>{title}</EmptyState.Title>
          <EmptyState.Description>{desc}</EmptyState.Description>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  );
};
