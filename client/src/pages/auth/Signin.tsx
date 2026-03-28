import { PasswordInput } from "@/components/ui/password-input";
import { baseUrl } from "@/main";
import {
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { Link, useOutletContext } from "react-router";

type SubmissionType = {
  apiUrl: string;
  data: Record<string, string | boolean>;
  urlNext: string | (() => void);
};

export type OutletContextType = {
  handleSubmit: (data: SubmissionType) => void;
  login: () => void;
  hasError: boolean;
  loading: boolean;
};

type formDataType = {
  phone_number: string;
  password: string;
};

export const Signin = () => {
  const { t } = useTranslation();
  const { handleSubmit, login, hasError, loading } =
    useOutletContext<OutletContextType>();

  const [formData, setFormData] = useState<formDataType>({
    phone_number: "",
    password: "",
  });

  const handleOnChange = (e: { target: { name: string; value: string } }) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submission = {
    apiUrl: `${baseUrl}/users/signin/`,
    data: formData,
    urlNext: "/home",
  };

  return (
    <>
      <VStack flex={0.5} gap={10}>
        <Heading>{t("loginPage.signIn")}</Heading>
        <Text textAlign={"center"} textStyle={"sm"}>
          👋🏽 {t("loginPage.welcomeText")}
        </Text>
        <Field.Root required colorPalette={"blue"}>
          <Field.Label>
            {t("loginPage.phoneNumber")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            placeholder="07xxxxxxxx"
            name="phone_number"
            onChange={handleOnChange}
          />
        </Field.Root>
        <Field.Root required colorPalette={"blue"}>
          <Field.Label>
            {t("loginPage.password")}
            <Field.RequiredIndicator />
          </Field.Label>
          <PasswordInput
            placeholder={t("loginPage.password")}
            name="password"
            onChange={handleOnChange}
          />
        </Field.Root>
        <Button
          colorPalette={"blue"}
          onClick={() => handleSubmit(submission)}
          disabled={!formData.phone_number || !formData.password || hasError}
          loading={loading}
        >
          {t("loginPage.signinBtn")}
        </Button>
      </VStack>

      <Button variant={"outline"} onClick={() => login()}>
        <FcGoogle /> {t("loginPage.loginWithGoogle")}
      </Button>

      <HStack>
        <Text>{t("loginPage.noAccount")}</Text>
        <Link
          to={"/signup"}
          style={{ fontWeight: "bold", color: "dodgerblue" }}
        >
          {t("loginPage.signUpLink")}
        </Link>{" "}
      </HStack>
    </>
  );
};
