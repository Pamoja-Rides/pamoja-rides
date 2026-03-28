import {
  Center,
  CloseButton,
  Dialog,
  Heading,
  Image,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import successGif from "@/assets/gif/success.gif";
import { useTranslation } from "react-i18next";

export const Success = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      size={"xs"}
      placement={"center"}
      motionPreset="slide-in-bottom"
      open={open}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                <Center>
                  <Image src={successGif} w={"40%"} />
                </Center>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack>
                <Heading>{t("successDialog.title")}</Heading>
                <Text textAlign={"center"}>
                  {t("verifyPage.resendSuccess")}
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild onClick={onClose}>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
