import { HStack } from "@chakra-ui/react";
import { ColorModeButton } from "../ui/color-mode";
import { LanguageSelection } from "@/pages/languageSelect/LanguageSelection";

export const Utilities = ({ color }: { color?: string }) => {
  return (
    <HStack>
      <ColorModeButton color={color} />
      <LanguageSelection />
    </HStack>
  );
};
