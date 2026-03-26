import {
  Alert,
  Button,
  Container,
  Field,
  Flex,
  Heading,
  Image,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useGoogleLogin } from "@react-oauth/google";
import logoIcon from "@/assets/logoIcon.svg";
import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import axios from "axios";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ColorModeButton } from "@/components/ui/color-mode";
import { LanguageSelection } from "./languageSelect/LanguageSelection";
import { FcGoogle } from "react-icons/fc";

export const Signin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    error: false,
  });

  const handleOnChange = (e: { target: { name: string; value: string } }) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/signin/",
        formData,
      );

      if (res.status === 200) {
        navigate("/home");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      setFormData({ ...formData, error: true });
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/google-auth/",
        { access_token: tokenResponse.access_token },
      );
      if (res.status === 200) navigate("/home");
    },
    onError: () => setFormData({ ...formData, error: true }),
  });

  useEffect(() => {
    if (formData.error) {
      setTimeout(
        () => setFormData((prevForm) => ({ ...prevForm, error: false })),
        5000,
      );
    }
  }, [formData.error]);
  return (
    <Container h={"100vh"}>
      <Flex height={"8%"} alignItems={"flex-end"}>
        <ColorModeButton />
        <LanguageSelection />
      </Flex>
      <Flex
        direction={"column"}
        h={"85%"}
        alignItems={"center"}
        justifyContent={"space-evenly"}
      >
        <Image src={logoIcon} width={50} />
        <VStack flex={0.5} gap={10}>
          {formData.error && (
            <Alert.Root status="error" variant="surface">
              <Alert.Indicator />
              <Alert.Title>{t("errors.loginFailed")}</Alert.Title>
            </Alert.Root>
          )}
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
              name="phone"
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
            onClick={handleSubmit}
            disabled={!formData.phone || !formData.password || formData.error}
          >
            {t("loginPage.signinBtn")}
          </Button>
        </VStack>

        <Button variant={"outline"} onClick={() => login()}>
          <FcGoogle /> {t("loginPage.loginWithGoogle")}
        </Button>

        <Text>
          {t("loginPage.noAccount")}{" "}
          <Link
            variant="plain"
            href="#"
            colorPalette="blue"
            fontWeight={"bold"}
          >
            {t("loginPage.signUpLink")}
          </Link>{" "}
        </Text>
      </Flex>
    </Container>
  );
};
