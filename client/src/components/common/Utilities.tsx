import { HStack, IconButton } from "@chakra-ui/react";
import { ColorModeButton } from "../ui/color-mode";
import { LanguageSelection } from "@/pages/languageSelect/LanguageSelection";
import { useNavigate } from "react-router";
import { LuLogOut } from "react-icons/lu";

export const Utilities = () => {
  const navigate = useNavigate();
  return (
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
  );
};
