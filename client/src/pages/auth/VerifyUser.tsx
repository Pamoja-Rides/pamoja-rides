import {
  Button,
  Flex,
  Heading,
  PinInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router";
import type { OutletContextType } from "./Signin";
import { useVerifyUserStore } from "@/store/store";
import { baseUrl } from "@/main";
import { Success } from "@/components/overlays";

export const VerifyUser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleSubmit, hasError, loading } =
    useOutletContext<OutletContextType>();
  const { email } = useVerifyUserStore((state) => state.verificationData);

  const [timer, setTimer] = useState(30);
  const [code, setCode] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const submission = {
    apiUrl: `${baseUrl}/users/verify-code/`,
    data: { email, code },
    next: (token: string) => {
      localStorage.setItem("token", token);
      navigate("/");
    },
  };

  useEffect(() => {
    let interval: number;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const handleResendCode = () => {
    handleSubmit({
      apiUrl: `${baseUrl}/users/verify-code/`,
      data: { email, code, resend: true },
      next: () => setOpenModal(true),
    });
    setTimer(30);
  };

  return (
    <VStack flex={0.6} gap={10}>
      <Heading>{t("verifyPage.welcomeText")}</Heading>

      <Text textAlign={"center"} textStyle={"sm"}>
        ✅ {t("verifyPage.welcomeSubText")}
      </Text>
      <PinInput.Root
        colorPalette={"blue"}
        onValueComplete={({ valueAsString }) => setCode(valueAsString)}
      >
        <PinInput.Control>
          {[0, 1, 2, 3].map((index) => (
            <PinInput.Input key={index} index={index} />
          ))}
        </PinInput.Control>
      </PinInput.Root>
      <Flex alignItems={"baseline"} justifyContent={"center"}>
        <Text textStyle={"sm"}>{t("verifyPage.noCode")}</Text>
        <Button
          variant={"plain"}
          colorPalette={"blue"}
          size={"sm"}
          disabled={timer > 0}
          onClick={handleResendCode}
        >
          {`${t("verifyPage.resend")} ${timer > 0 ? `in ${timer}s` : ""}`}
        </Button>
      </Flex>
      <Button
        colorPalette={"blue"}
        onClick={() => handleSubmit(submission)}
        disabled={!code || hasError}
        loading={loading}
      >
        {t("verifyPage.verifyCodeBtn")}
      </Button>
      <Success open={openModal} onClose={() => setOpenModal(false)} />
    </VStack>
  );
};
