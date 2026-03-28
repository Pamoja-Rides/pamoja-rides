import { PasswordInput } from "@/components/ui/password-input";
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
import { Link, useNavigate, useOutletContext } from "react-router";
import type { OutletContextType } from "./Signin";
import { useVerifyUserStore } from "@/store/store";
import { baseUrl } from "@/main";

export const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleSubmit, hasError, login, loading } =
    useOutletContext<OutletContextType>();
  const setFormState = useVerifyUserStore((state) => state.setVerificationData);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const handleOnChange = (e: { target: { name: string; value: string } }) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submission = {
    apiUrl: `${baseUrl}/users/signup/`,
    data: formData,
    next: () => navigate("/verify"),
  };

  return (
    <>
      <VStack flex={0.7} gapY={7}>
        <Heading>{t("signupPage.signUp")}</Heading>
        <Text textAlign={"center"} textStyle={"sm"}>
          👋🏽 {t("signupPage.welcomeText")}
        </Text>
        <HStack w={"full"}>
          <Field.Root>
            <Field.Label>{t("signupPage.firstName")}</Field.Label>
            <Field.RequiredIndicator />
            <Input
              placeholder={t("signupPage.placeholders.firstName")}
              name="first_name"
              onChange={handleOnChange}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>{t("signupPage.lastName")}</Field.Label>
            <Field.RequiredIndicator />
            <Input
              placeholder={t("signupPage.placeholders.lastName")}
              name="last_name"
              onChange={handleOnChange}
            />
          </Field.Root>
        </HStack>
        <Field.Root required colorPalette={"blue"}>
          <Field.Label>
            {t("signupPage.email")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            placeholder={t("signupPage.placeholders.email")}
            name="email"
            onChange={handleOnChange}
          />
        </Field.Root>
        <Field.Root required colorPalette={"blue"}>
          <Field.Label>
            {t("signupPage.phoneNumber")}
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
            {t("signupPage.password")}
            <Field.RequiredIndicator />
          </Field.Label>
          <PasswordInput
            placeholder={t("signupPage.password")}
            name="password"
            onChange={handleOnChange}
          />
        </Field.Root>
        <Button
          colorPalette={"blue"}
          onClick={() => {
            setFormState(formData.email);
            handleSubmit(submission);
          }}
          disabled={
            !formData.phone_number ||
            !formData.email ||
            !formData.password ||
            hasError
          }
          loading={loading}
        >
          {t("signupPage.signupBtn")}
        </Button>
        <Button variant={"outline"} onClick={() => login()}>
          <FcGoogle /> {t("signupPage.signupWithGoogle")}
        </Button>

        <HStack>
          <Text>{t("signupPage.haveAccount")}</Text>
          <Link
            to={"/signin"}
            style={{ fontWeight: "bold", color: "dodgerblue" }}
          >
            {t("signupPage.signinLink")}
          </Link>{" "}
        </HStack>
      </VStack>
    </>
  );
};
