import {
  Alert,
  Badge,
  Box,
  Field,
  FileUpload,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuCircleX,
  LuUpload,
  LuUser,
} from "react-icons/lu";
import { IoCloseOutline } from "react-icons/io5";
import { useContext, useEffect, useRef, useState } from "react";
import { useNIDOCR, useLicenseOCR, crossCheckDocuments } from "@/hooks/useOCR";
import type {
  CrossCheckResult,
  ParsedNID,
  ParsedLicense,
} from "@/hooks/useOCR";
import { PostRideContext } from "@/context/postRide-context";
import { uploadToCloudinary } from "@/utils/cloudinary";
import axios from "axios";
import { baseUrl } from "@/main";

interface DriverProfileData {
  nid_number: string;
  license_number: string;
  full_name_on_id: string;
  nid_image_url: string;
  license_image_url: string;
}

// Fuzzy name match — returns true if at least one word overlaps
const namesSoftMatch = (a: string, b: string): boolean => {
  const wordsA = a
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const wordsB = b
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  return wordsA.some((w) => wordsB.includes(w));
};

export const DriverDetails = () => {
  const nidOCR = useNIDOCR();
  const licenseOCR = useLicenseOCR();
  const context = useContext(PostRideContext);

  // Hold actual File references for Cloudinary upload + cross-check
  const nidFileRef = useRef<File | null>(null);
  const licFileRef = useRef<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [crossChecking, setCrossChecking] = useState(false);
  const [crossCheckResult, setCrossCheckResult] =
    useState<CrossCheckResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Whether the user already has a driver profile on record
  const [existingProfile, setExistingProfile] =
    useState<DriverProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [usingExisting, setUsingExisting] = useState(false);
  const [showExistingDocBadge, setShowExistingDocBadge] = useState(true);

  // Fetch existing driver profile on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setProfileLoading(false);
      return;
    }

    axios
      .get(`${baseUrl}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const profile = res.data?.driver_profile;
        if (profile?.nid_number && profile?.license_number) {
          setExistingProfile(profile);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // Pre-fill form with existing profile when user chooses to reuse it
  const applyExistingProfile = (hasCancelled = false) => {
    if (hasCancelled) {
      setShowExistingDocBadge(false);
      return;
    }
    if (!existingProfile || !context || hasCancelled) return;
    context.setFormData((prev) => ({
      ...prev,
      nid_number: existingProfile.nid_number,
      license_number: existingProfile.license_number,
      full_name_on_id: existingProfile.full_name_on_id,
      nid_image_url: existingProfile.nid_image_url,
      license_image_url: existingProfile.license_image_url,
      // Existing profile was already verified — no new flag
      ai_verified_same_person: true,
      ai_confidence: "high",
      identity_flag: false,
      identity_flag_reason: "",
    }));
    setUsingExisting(true);
  };

  // Run Cloudinary upload + cross-check after both docs pass OCR
  const runUploadAndCrossCheck = async (
    nidFile: File,
    licFile: File,
    nidResult: ParsedNID,
    licResult: ParsedLicense,
  ) => {
    if (!context) return;
    setUploading(true);
    setUploadError(null);

    try {
      // 1. Upload both images to Cloudinary in parallel
      const [nidUrl, licUrl] = await Promise.all([
        uploadToCloudinary(nidFile, "driver-nid"),
        uploadToCloudinary(licFile, "driver-license"),
      ]);

      // 2. Cross-check both documents with Gemini
      setCrossChecking(true);
      const check = await crossCheckDocuments(nidFile, licFile);
      setCrossCheckResult(check);
      setCrossChecking(false);

      // 3. Soft-compare Gemini-extracted names against account name
      const accountName = `${context.formData.full_name_on_id}`.trim();
      const nidName = check.nidName || nidResult.names;
      const licName = check.licenseName || licResult.names;

      const accountMatchesNid = accountName
        ? namesSoftMatch(accountName, nidName)
        : true;

      // 4. Determine flag
      const shouldFlag =
        !check.samePerson || check.confidence === "low" || !accountMatchesNid;

      const flagReason = [
        !check.samePerson &&
          "AI determined NID and Driving License belong to different people.",
        check.confidence === "low" && "AI confidence in identity match is low.",
        !accountMatchesNid &&
          `Account name does not match NID name: "${nidName}".`,
      ]
        .filter(Boolean)
        .join(" ");

      // 5. Update form context with real URLs and verification metadata
      context.setFormData((prev) => ({
        ...prev,
        nid_number: nidResult.idNumber,
        full_name_on_id: nidResult.names,
        license_number: licResult.licenseNumber,
        nid_image_url: nidUrl,
        license_image_url: licUrl,
        ai_verified_same_person: check.samePerson,
        ai_confidence: check.confidence,
        ai_nid_name: nidName,
        ai_license_name: licName,
        identity_flag: shouldFlag,
        identity_flag_reason: flagReason,
      }));
    } catch {
      setUploadError(
        "Failed to upload documents. Please check your connection and try again.",
      );
      setCrossChecking(false);
    } finally {
      setUploading(false);
    }
  };

  // Trigger upload+cross-check when both OCR results are ready and valid
  useEffect(() => {
    if (
      nidOCR.isValid &&
      licenseOCR.isValid &&
      nidFileRef.current &&
      licFileRef.current &&
      !crossCheckResult &&
      !uploading
    ) {
      runUploadAndCrossCheck(
        nidFileRef.current,
        licFileRef.current,
        nidOCR.result!,
        licenseOCR.result!,
      );
    }
  }, [nidOCR.isValid, licenseOCR.isValid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!context) return null;
  const { formData, setFormData } = context;

  const isProcessing =
    nidOCR.isLoading || licenseOCR.isLoading || uploading || crossChecking;
  const bothDocsReady =
    formData.nid_image_url &&
    formData.license_image_url &&
    formData.nid_image_url !== "" &&
    formData.license_image_url !== "";

  return (
    <VStack w="full" gap={5} mt={5}>
      <VStack>
        <Icon as={LuUser} color="fg.muted" size="lg" />
        <Heading>Driver Details</Heading>
        <Text color="fg.muted" fontWeight="light" textStyle="sm">
          Upload your National ID and Driving License
        </Text>
      </VStack>

      {/* Existing profile banner */}
      {!profileLoading &&
        existingProfile &&
        !usingExisting &&
        showExistingDocBadge && (
          <Alert.Root
            status="info"
            variant="surface"
            borderRadius="xl"
            w="full"
          >
            <Alert.Indicator />
            <Alert.Title flex={1} fontSize="xs">
              We found your existing documents on file. Use them or upload new
              ones.
            </Alert.Title>
            <Alert.Description>
              <HStack gap={2} mt={1}>
                <Badge
                  colorPalette="blue"
                  variant="solid"
                  cursor="pointer"
                  onClick={() => applyExistingProfile()}
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  Use existing
                </Badge>
                <IconButton
                  variant={"ghost"}
                  onClick={() => applyExistingProfile(true)}
                >
                  <IoCloseOutline />
                </IconButton>
              </HStack>
            </Alert.Description>
          </Alert.Root>
        )}

      {usingExisting ? (
        // Show summary of reused profile
        <Box
          w="full"
          borderWidth={1}
          borderRadius="xl"
          p={5}
          borderColor="green.300"
          bg="green.50"
          _dark={{ bg: "green.950" }}
        >
          <HStack gap={3} mb={3}>
            <Icon color="green.500" boxSize={5}>
              <LuCircleCheck />
            </Icon>
            <Text
              fontWeight="700"
              color="green.700"
              _dark={{ color: "green.300" }}
            >
              Using your saved documents
            </Text>
          </HStack>
          <Grid templateColumns="1fr 1fr" gap={3}>
            <Box>
              <Text fontSize="xs" color="fg.muted">
                Full Name on ID
              </Text>
              <Text fontSize="sm" fontWeight="600">
                {existingProfile!.full_name_on_id}
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted">
                NID Number
              </Text>
              <Text fontSize="sm" fontWeight="600" fontFamily="mono">
                {existingProfile!.nid_number}
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted">
                License Number
              </Text>
              <Text fontSize="sm" fontWeight="600" fontFamily="mono">
                {existingProfile!.license_number}
              </Text>
            </Box>
          </Grid>
          <Text
            fontSize="xs"
            color="blue.500"
            cursor="pointer"
            mt={3}
            textDecor="underline"
            onClick={() => {
              setUsingExisting(false);
              context.setFormData((prev) => ({
                ...prev,
                nid_number: "",
                license_number: "",
                full_name_on_id: "",
                nid_image_url: "",
                license_image_url: "",
              }));
            }}
          >
            Upload different documents instead
          </Text>
        </Box>
      ) : (
        <>
          {/* Upload cards */}
          <Grid templateColumns="1fr 1fr" gap={4} w="full">
            <DocUploadCard
              label="National ID"
              isLoading={nidOCR.isLoading}
              isValid={nidOCR.isValid}
              hasResult={!!nidOCR.result}
              isTampered={nidOCR.result?.isTampered ?? false}
              resultLine1={nidOCR.result?.names}
              resultLine2={nidOCR.result?.idNumber}
              resultLine3={nidOCR.result?.validationNote}
              error={nidOCR.error}
              onFileAccept={(file) => {
                nidFileRef.current = file;
                nidOCR.recognize(file);
              }}
            />
            <DocUploadCard
              label="Driving License"
              isLoading={licenseOCR.isLoading}
              isValid={licenseOCR.isValid}
              hasResult={!!licenseOCR.result}
              isTampered={licenseOCR.result?.isTampered ?? false}
              resultLine1={licenseOCR.result?.names}
              resultLine2={licenseOCR.result?.licenseNumber}
              resultLine3={
                licenseOCR.result
                  ? `Class ${licenseOCR.result.licenseClass} · Exp ${licenseOCR.result.expiryDate}`
                  : undefined
              }
              error={licenseOCR.error}
              onFileAccept={(file) => {
                licFileRef.current = file;
                licenseOCR.recognize(file);
              }}
            />
          </Grid>

          {/* Upload / cross-check progress */}
          {(uploading || crossChecking) && (
            <HStack
              w="full"
              gap={3}
              p={4}
              bg="blue.50"
              _dark={{ bg: "blue.950" }}
              borderRadius="xl"
            >
              <Spinner size="sm" color="blue.500" />
              <Text
                fontSize="sm"
                color="blue.600"
                _dark={{ color: "blue.300" }}
              >
                {uploading && !crossChecking
                  ? "Uploading documents securely..."
                  : "Verifying identity across documents..."}
              </Text>
            </HStack>
          )}

          {/* Upload error */}
          {uploadError && (
            <Alert.Root
              status="error"
              variant="surface"
              borderRadius="xl"
              w="full"
            >
              <Alert.Indicator />
              <Alert.Title fontSize="sm">{uploadError}</Alert.Title>
            </Alert.Root>
          )}

          {/* Cross-check result */}
          {crossCheckResult && !crossChecking && !uploading && (
            <Box
              w="full"
              p={4}
              borderRadius="xl"
              borderWidth={1}
              borderColor={
                crossCheckResult.samePerson ? "green.300" : "orange.300"
              }
              bg={crossCheckResult.samePerson ? "green.50" : "orange.50"}
              _dark={{
                bg: crossCheckResult.samePerson ? "green.950" : "orange.950",
              }}
            >
              <HStack gap={2} mb={1}>
                <Icon
                  color={
                    crossCheckResult.samePerson ? "green.500" : "orange.500"
                  }
                  boxSize={5}
                >
                  {crossCheckResult.samePerson ? (
                    <LuCircleCheck />
                  ) : (
                    <LuCircleAlert />
                  )}
                </Icon>
                <Text
                  fontWeight="700"
                  fontSize="sm"
                  color={
                    crossCheckResult.samePerson ? "green.700" : "orange.700"
                  }
                  _dark={{
                    color: crossCheckResult.samePerson
                      ? "green.300"
                      : "orange.300",
                  }}
                >
                  {crossCheckResult.samePerson
                    ? "Identity verified — both documents match"
                    : "Identity mismatch — documents may belong to different people"}
                </Text>
              </HStack>
            </Box>
          )}
        </>
      )}

      {/* Phone number */}
      <Field.Root w="full">
        <Field.Label>Phone number</Field.Label>
        <Input
          placeholder="07xxxxxxxx"
          value={formData.driver_phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, driver_phone: e.target.value }))
          }
        />
      </Field.Root>

      {/* Notes */}
      <Field.Root w="full">
        <Field.Label>Additional Notes (optional)</Field.Label>
        <Textarea
          variant="outline"
          placeholder="No smoking, no baggage, etc..."
          value={formData.notes ?? ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </Field.Root>
    </VStack>
  );
};

interface DocUploadCardProps {
  label: string;
  isLoading: boolean;
  isValid: boolean;
  hasResult: boolean;
  isTampered: boolean;
  resultLine1?: string;
  resultLine2?: string;
  resultLine3?: string;
  error: string | null;
  onFileAccept: (file: File) => void;
}

const DocUploadCard = ({
  label,
  isLoading,
  isValid,
  hasResult,
  isTampered,
  resultLine1,
  resultLine2,
  resultLine3,
  error,
  onFileAccept,
}: DocUploadCardProps) => {
  const borderColor = hasResult
    ? isTampered
      ? "red.400"
      : isValid
        ? "green.300"
        : "red.300"
    : "border";

  const bg = hasResult
    ? isTampered
      ? "red.50"
      : isValid
        ? "green.50"
        : "red.50"
    : "bg.panel";

  const darkBg = hasResult
    ? isTampered
      ? "red.950"
      : isValid
        ? "green.950"
        : "red.950"
    : "bg.panel";

  return (
    <Flex
      direction="column"
      borderWidth={1}
      borderRadius="xl"
      p={4}
      gap={3}
      align="center"
      borderColor={borderColor}
      bg={bg}
      _dark={{ bg: darkBg }}
      minH="160px"
      justify="center"
    >
      <Text
        fontSize="xs"
        fontWeight="700"
        color="fg.muted"
        textTransform="uppercase"
      >
        {label}
      </Text>

      {isLoading ? (
        <VStack gap={2}>
          <Spinner color="blue.500" size="md" />
          <Text fontSize="2xs" color="fg.muted">
            Reading document...
          </Text>
        </VStack>
      ) : error ? (
        <VStack gap={2}>
          <Icon color="red.500" boxSize={6}>
            <LuCircleX />
          </Icon>
          <Text fontSize="2xs" color="red.500" textAlign="center">
            {error}
          </Text>
          <ReUploadTrigger onFileAccept={onFileAccept} />
        </VStack>
      ) : hasResult ? (
        <VStack gap={1} w="full">
          <Icon
            color={isValid && !isTampered ? "green.500" : "red.500"}
            boxSize={6}
          >
            {isValid && !isTampered ? <LuCircleCheck /> : <LuCircleX />}
          </Icon>
          {isTampered && (
            <Badge
              colorPalette="red"
              variant="solid"
              borderRadius="full"
              px={2}
              fontSize="2xs"
            >
              Tampered
            </Badge>
          )}
          {resultLine1 && (
            <Text fontSize="xs" fontWeight="600" textAlign="center">
              {resultLine1}
            </Text>
          )}
          {resultLine2 && (
            <Text
              fontSize="2xs"
              color="fg.muted"
              textAlign="center"
              fontFamily="mono"
            >
              {resultLine2}
            </Text>
          )}
          {resultLine3 && (
            <Text fontSize="2xs" color="fg.subtle" textAlign="center">
              {resultLine3}
            </Text>
          )}
          <ReUploadTrigger onFileAccept={onFileAccept} />
        </VStack>
      ) : (
        <FileUpload.Root
          accept={["image/jpeg", "image/png"]}
          maxFiles={1}
          onFileAccept={(details) => onFileAccept(details.files[0])}
        >
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone>
            <Icon size="md" color="fg.muted">
              <LuUpload />
            </Icon>
            <FileUpload.DropzoneContent>
              <Box fontSize="xs" textAlign="center">
                Upload {label}
              </Box>
              <Box fontSize="2xs" color="fg.muted">
                .png, .jpg
              </Box>
            </FileUpload.DropzoneContent>
          </FileUpload.Dropzone>
        </FileUpload.Root>
      )}
    </Flex>
  );
};

const ReUploadTrigger = ({
  onFileAccept,
}: {
  onFileAccept: (file: File) => void;
}) => (
  <FileUpload.Root
    accept={["image/jpeg", "image/png"]}
    maxFiles={1}
    onFileAccept={(details) => onFileAccept(details.files[0])}
  >
    <FileUpload.HiddenInput />
    <FileUpload.Trigger asChild>
      <Text
        fontSize="2xs"
        color="blue.500"
        cursor="pointer"
        textDecor="underline"
      >
        Re-upload
      </Text>
    </FileUpload.Trigger>
  </FileUpload.Root>
);
