import {
  Box,
  Field,
  FileUpload,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { LuUpload, LuUser } from "react-icons/lu";
import { FaCheckCircle } from "react-icons/fa";
import { useContext, useEffect } from "react";
import { useOCR } from "@/hooks/useOCR";
import { PostRideContext } from "@/context/postRide-context";

const validateIdNumber = (idNumber: string | undefined): boolean => {
  if (!idNumber) return false;
  if (!/^\d{16}$/.test(idNumber)) return false;
  const status = +idNumber.charAt(0);
  const year = +idNumber.substring(1, 5);
  const gender = +idNumber.charAt(5);
  const currentYear = new Date().getFullYear();
  if (![1, 2, 3].includes(status)) return false;
  if (year < 1900 || year > currentYear) return false;
  if (![7, 8].includes(gender)) return false;
  return true;
};

export const DriverDetails = () => {
  const { text, recognizeText, isLoading } = useOCR();
  const context = useContext(PostRideContext);

  // Only depend on `text` — setFormData is a stable setter and won't cause cascades
  useEffect(() => {
    if (!text?.idNumber || !context) return;
    if (!validateIdNumber(text.idNumber)) return;

    context.setFormData((prev) => ({
      ...prev,
      nid_number: text.idNumber,
      full_name_on_id: text.names,
      nid_image_url: "https://cloudinary.com/dummy-nid",
      license_image_url: "https://cloudinary.com/dummy-lic",
      license_number: "LIC-" + text.idNumber,
    }));
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!context) return null;
  const { formData, setFormData } = context;
  const isIdValid = validateIdNumber(text?.idNumber);

  return (
    <VStack>
      <VStack mt={5}>
        <Icon as={LuUser} color="fg.muted" size="lg" />
        <Heading>Driver Details</Heading>
        <Text color="fg.muted" fontWeight="light" textStyle="sm">
          Add the driver details
        </Text>
      </VStack>

      {text?.idNumber ? (
        <>
          <Flex
            direction="column"
            flex={1}
            rowGap={5}
            padding="5"
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            rounded={10}
            mt={5}
          >
            <HStack>
              <Field.Root>
                <Field.Label>Names</Field.Label>
                <Input value={text.names} disabled />
              </Field.Root>
              <Field.Root>
                <Field.Label>Phone number</Field.Label>
                <Input
                  placeholder="07xxxxxxxx"
                  value={formData.driver_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      driver_phone: e.target.value,
                    }))
                  }
                />
              </Field.Root>
            </HStack>

            <HStack alignItems="center" w="full" columnGap={5}>
              <Field.Root w="95%">
                <Field.Label>ID Number</Field.Label>
                <Input value={text.idNumber} disabled />
              </Field.Root>
              {!isIdValid ? (
                <Spinner />
              ) : (
                <Icon mt={5} color="green">
                  <FaCheckCircle />
                </Icon>
              )}
            </HStack>
          </Flex>

          <Field.Root>
            <Field.Label>Additional Notes</Field.Label>
            <Textarea
              variant="outline"
              placeholder="No smoking, no baggage, etc..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </Field.Root>
        </>
      ) : (
        <Flex direction="column" alignItems="center" w="full" mt={5}>
          {isLoading ? (
            <Spinner color="blue" size="lg" />
          ) : (
            <FileUpload.Root
              maxW="xl"
              alignItems="stretch"
              maxFiles={2}
              accept={["image/jpeg", "image/png"]}
              onFileAccept={(details) => recognizeText(details.files[0])}
            >
              <FileUpload.HiddenInput />
              <FileUpload.Dropzone>
                <Icon size="md" color="fg.muted">
                  <LuUpload />
                </Icon>
                <FileUpload.DropzoneContent>
                  <Box>Upload your National ID and Driving license here</Box>
                  <Box color="fg.muted">.png, .jpg</Box>
                </FileUpload.DropzoneContent>
              </FileUpload.Dropzone>
              <FileUpload.ItemGroup>
                <HStack>
                  <FileUpload.Items />
                </HStack>
              </FileUpload.ItemGroup>
            </FileUpload.Root>
          )}
        </Flex>
      )}
    </VStack>
  );
};
