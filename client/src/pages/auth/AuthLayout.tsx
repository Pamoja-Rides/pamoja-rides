import { Alert, Container, Flex, Image } from "@chakra-ui/react";
import { useGoogleLogin } from "@react-oauth/google";
import logoIcon from "@/assets/logoIcon.svg";
import { useEffect, useState } from "react";
import axios from "axios";
import { Outlet, useNavigate } from "react-router";
import { ColorModeButton } from "@/components/ui/color-mode";
import { LanguageSelection } from "../languageSelect/LanguageSelection";
import { baseUrl } from "@/main";

export const AuthLayout = () => {
  const navigate = useNavigate();

  const [error, setError] = useState({ hasError: false, errorMessage: "" });
  const [loading, setLoading] = useState(false);

  const ERROR_CODES_MESSAGE: Record<number, string> = {
    400: "Bad request",
    401: "Email or password is incorrect",
    403: "Unauthorized or Account not verified yet",
    500: "An error occurred",
  };

  const handleSubmit = async ({
    apiUrl,
    data,
    urlNext,
  }: {
    apiUrl: string;
    data: Record<string, string>;
    urlNext: string | (() => void);
  }) => {
    try {
      setLoading(true);
      const res = await axios.post(apiUrl, data);

      if (res.status === 200 || res.status === 201) {
        setLoading(false);
        if (typeof urlNext === "string") {
          navigate(urlNext);
        } else {
          urlNext();
        }
      }
    } catch (err: unknown) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        setError({
          hasError: true,
          errorMessage: status
            ? ERROR_CODES_MESSAGE[status]
            : "An error occurred",
        });
      }
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await axios.post(`${baseUrl}/users/google-auth/`, {
        access_token: tokenResponse.access_token,
      });
      if (res.status === 200) navigate("/home");
    },
    onError: () =>
      setError({
        hasError: true,
        errorMessage: "Unable to authenticate with Google",
      }),
  });

  useEffect(() => {
    if (error.hasError) {
      setTimeout(
        () =>
          setError((prev) => ({ ...prev, hasError: false, errorMessage: "" })),
        5000,
      );
    }
  }, [error.hasError]);
  return (
    <Container h={"100vh"}>
      <Flex height={"8%"} alignItems={"flex-end"}>
        <ColorModeButton />
        <LanguageSelection />
      </Flex>
      <Flex
        direction={"column"}
        h={"86%"}
        alignItems={"center"}
        justifyContent={"space-evenly"}
      >
        {error.hasError && (
          <Alert.Root status="error" variant="surface">
            <Alert.Indicator />
            <Alert.Title>{error.errorMessage}</Alert.Title>
          </Alert.Root>
        )}
        <Image src={logoIcon} width={50} />
        <Outlet
          context={{ handleSubmit, login, hasError: error.hasError, loading }}
        />
      </Flex>
    </Container>
  );
};
