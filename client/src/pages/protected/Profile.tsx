import {
  Avatar,
  Badge,
  Box,
  Button,
  CloseButton,
  Container,
  DataList,
  Drawer,
  Field,
  FileUpload,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Portal,
  Select,
  Separator,
  Skeleton,
  SkeletonText,
  Spinner,
  Text,
  VStack,
  createListCollection,
  defineStyle,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  LuBadgeCheck,
  LuCalendar,
  LuCar,
  LuCamera,
  LuCircleAlert,
  LuIdCard,
  LuLanguages,
  LuLogOut,
  LuMail,
  LuPencil,
  LuPhone,
  LuShield,
  LuStar,
  LuTicket,
} from "react-icons/lu";
import { baseUrl } from "@/main";
import { toaster } from "@/components/ui/toaster";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface DriverProfile {
  nid_number: string;
  license_number: string;
  full_name_on_id: string;
  nid_image_url: string;
  license_image_url: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string | null;
  is_verified: boolean;
  is_driver: boolean;
  preferred_language: string;
  member_since: string;
  rides_posted: number;
  rides_booked: number;
  avatar_url: string | null;
  driver_profile: DriverProfile | null;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "🇺🇸 English",
  fr: "🇫🇷 Français",
  rw: "🇷🇼 Kinyarwanda",
};

const languageCollection = createListCollection({
  items: [
    { label: "English", value: "en", icon: "🇺🇸" },
    { label: "Français", value: "fr", icon: "🇫🇷" },
    { label: "Kinyarwanda", value: "rw", icon: "🇷🇼" },
  ],
});

const ringCss = defineStyle({
  outlineWidth: "2px",
  outlineColor: "colorPalette.500",
  outlineOffset: "2px",
  outlineStyle: "solid",
});

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    preferred_language: "en",
    avatar_url: "",
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchProfile = async () => {
    try {
      const res = await axios.get<UserProfile>(
        `${baseUrl}/users/me/`,
        authHeader(),
      );
      setProfile(res.data);
      setEditData({
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        email: res.data.email ?? "",
        phone_number: res.data.phone_number ?? "",
        preferred_language: res.data.preferred_language,
        avatar_url: res.data.avatar_url ?? "",
      });
    } catch {
      toaster.create({ title: "Failed to load profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const uploadAvatarToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "pamoja-rides/avatars");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData },
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");
    return data.secure_url;
  };

  const handleAvatarChange = async (file: File) => {
    setAvatarUploading(true);
    try {
      const url = await uploadAvatarToCloudinary(file);
      // Save immediately to backend
      await axios.patch(
        `${baseUrl}/users/me/update/`,
        { avatar_url: url },
        authHeader(),
      );
      setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev));
      setEditData((prev) => ({ ...prev, avatar_url: url }));
      toaster.create({ title: "Photo updated", type: "success" });
    } catch {
      toaster.create({ title: "Photo upload failed", type: "error" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.patch<UserProfile>(
        `${baseUrl}/users/me/update/`,
        editData,
        authHeader(),
      );
      setProfile(res.data);
      i18n.changeLanguage(editData.preferred_language);
      setEditOpen(false);
      toaster.create({ title: "Profile updated", type: "success" });
    } catch {
      toaster.create({ title: "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin", { replace: true });
  };

  const initials = profile
    ? `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase()
    : "??";

  const memberSince = profile
    ? new Date(profile.member_since).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Box minH="100vh" bg="bg">
      {/* Hero */}
      <Box
        bgGradient="to-br"
        gradientFrom="blue.700"
        gradientTo="blue.500"
        pt={12}
        pb={24}
        px={6}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-40px"
          right="-40px"
          w="180px"
          h="180px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />
        <Box
          position="absolute"
          bottom="-20px"
          left="-30px"
          w="120px"
          h="120px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />

        <Flex justify="space-between" align="center" mb={8} position="relative">
          <Heading size="md" color="white">
            Profile
          </Heading>
          <Button
            variant="ghost"
            size="sm"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={() => setEditOpen(true)}
          >
            <LuPencil /> Edit
          </Button>
        </Flex>

        <Flex direction="column" align="center" gap={3} position="relative">
          {/* Avatar with upload overlay */}
          <Box position="relative">
            {loading ? (
              <Skeleton boxSize="80px" borderRadius="full" />
            ) : (
              <FileUpload.Root
                accept={["image/jpeg", "image/png", "image/webp"]}
                maxFiles={1}
                onFileAccept={(details) => handleAvatarChange(details.files[0])}
              >
                <FileUpload.HiddenInput />
                <FileUpload.Trigger asChild>
                  <Box position="relative" cursor="pointer">
                    <Avatar.Root
                      size="2xl"
                      bg="white"
                      css={ringCss}
                      colorPalette={"blue"}
                    >
                      {profile?.avatar_url ? (
                        <Avatar.Image src={profile.avatar_url} />
                      ) : (
                        <Avatar.Fallback
                          color="blue.600"
                          fontWeight="800"
                          fontSize="2xl"
                        >
                          {initials}
                        </Avatar.Fallback>
                      )}
                    </Avatar.Root>
                    <Flex
                      position="absolute"
                      bottom={0}
                      right={0}
                      w="26px"
                      h="26px"
                      borderRadius="full"
                      bg="white"
                      align="center"
                      justify="center"
                      shadow="md"
                    >
                      {avatarUploading ? (
                        <Spinner size="xs" color="blue.500" />
                      ) : (
                        <Icon color="blue.600" boxSize={3.5}>
                          <LuCamera />
                        </Icon>
                      )}
                    </Flex>
                  </Box>
                </FileUpload.Trigger>
              </FileUpload.Root>
            )}
          </Box>

          {loading ? (
            <SkeletonText noOfLines={2} w="160px" />
          ) : (
            <VStack gap={1}>
              <Heading size="lg" color="white" textAlign="center">
                {profile?.first_name} {profile?.last_name}
              </Heading>
              <HStack gap={2}>
                {profile?.is_verified ? (
                  <Badge
                    colorPalette="green"
                    variant="solid"
                    borderRadius="full"
                    px={3}
                  >
                    <LuBadgeCheck /> Verified
                  </Badge>
                ) : (
                  <Badge
                    colorPalette="orange"
                    variant="solid"
                    borderRadius="full"
                    px={3}
                  >
                    <LuCircleAlert /> Unverified
                  </Badge>
                )}
                <Badge
                  colorPalette={profile?.is_driver ? "purple" : "blue"}
                  variant="solid"
                  borderRadius="full"
                  px={3}
                >
                  {profile?.is_driver ? (
                    <>
                      <LuCar /> Driver
                    </>
                  ) : (
                    <>
                      <LuTicket /> Passenger
                    </>
                  )}
                </Badge>
              </HStack>
            </VStack>
          )}
        </Flex>
      </Box>

      <Container maxW="container.md" mt={-16} pb={32} position="relative">
        {/* Stats */}
        <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={4}>
          {/* Rides Taken — navigates to booked tab */}
          <Box
            bg="bg.panel"
            borderRadius="2xl"
            shadow="md"
            p={4}
            textAlign="center"
            cursor="pointer"
            transition="all 0.15s ease"
            _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
            onClick={() => navigate("/rides?tab=booked")}
          >
            {loading ? (
              <SkeletonText noOfLines={2} />
            ) : (
              <VStack gap={1}>
                <Icon color="blue.500" boxSize={5}>
                  <LuTicket />
                </Icon>
                <Text
                  fontWeight="800"
                  fontSize="2xl"
                  color="blue.600"
                  lineHeight="1.1"
                >
                  {profile?.rides_booked ?? 0}
                </Text>
                <Text fontSize="2xs" color="fg.muted" fontWeight="500">
                  Rides Taken
                </Text>
              </VStack>
            )}
          </Box>

          {/* Rides Given — navigates to posted tab */}
          <Box
            bg="bg.panel"
            borderRadius="2xl"
            shadow="md"
            p={4}
            textAlign="center"
            cursor="pointer"
            transition="all 0.15s ease"
            _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
            onClick={() => navigate("/rides?tab=posted")}
          >
            {loading ? (
              <SkeletonText noOfLines={2} />
            ) : (
              <VStack gap={1}>
                <Icon color="blue.500" boxSize={5}>
                  <LuCar />
                </Icon>
                <Text
                  fontWeight="800"
                  fontSize="2xl"
                  color="blue.600"
                  lineHeight="1.1"
                >
                  {profile?.rides_posted ?? 0}
                </Text>
                <Text fontSize="2xs" color="fg.muted" fontWeight="500">
                  Rides Given
                </Text>
              </VStack>
            )}
          </Box>

          {/* Member Since — not clickable */}
          <Box
            bg="bg.panel"
            borderRadius="2xl"
            shadow="md"
            p={4}
            textAlign="center"
          >
            {loading ? (
              <SkeletonText noOfLines={2} />
            ) : (
              <VStack gap={1}>
                <Icon color="blue.500" boxSize={5}>
                  <LuCalendar />
                </Icon>
                <Text
                  fontWeight="800"
                  fontSize="sm"
                  color="blue.600"
                  lineHeight="1.1"
                >
                  {memberSince || "—"}
                </Text>
                <Text fontSize="2xs" color="fg.muted" fontWeight="500">
                  Member Since
                </Text>
              </VStack>
            )}
          </Box>
        </Grid>
        {/* Contact info */}
        <Box bg="bg.panel" borderRadius="2xl" shadow="md" p={6} mb={4}>
          <Heading
            size="sm"
            mb={4}
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Contact Info
          </Heading>
          {loading ? (
            <SkeletonText noOfLines={4} gap={5} />
          ) : (
            <DataList.Root orientation="horizontal" gap={5}>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuPhone />
                    </Icon>
                    <Text>Phone</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue fontWeight="600">
                  {profile?.phone_number ?? "—"}
                </DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuMail />
                    </Icon>
                    <Text>Email</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue fontWeight="600">
                  {profile?.email ?? "—"}
                </DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuLanguages />
                    </Icon>
                    <Text>Language</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue fontWeight="600">
                  {LANGUAGE_LABELS[profile?.preferred_language ?? "en"]}
                </DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuShield />
                    </Icon>
                    <Text>Status</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue>
                  {profile?.is_verified ? (
                    <Badge colorPalette="green" variant="subtle">
                      Verified
                    </Badge>
                  ) : (
                    <Badge colorPalette="orange" variant="subtle">
                      Pending verification
                    </Badge>
                  )}
                </DataList.ItemValue>
              </DataList.Item>
            </DataList.Root>
          )}
        </Box>
        {/* Driver section — real data from driver_profile */}
        {profile?.is_driver && profile.driver_profile && (
          <Box bg="bg.panel" borderRadius="2xl" shadow="md" p={6} mb={4}>
            <HStack mb={4} justify="space-between">
              <Heading
                size="sm"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Driver Details
              </Heading>
              <Badge
                colorPalette="purple"
                variant="subtle"
                borderRadius="full"
                px={3}
              >
                <LuStar /> Active Driver
              </Badge>
            </HStack>
            <DataList.Root orientation="horizontal" gap={5}>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuIdCard />
                    </Icon>
                    <Text>Full Name on ID</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue fontWeight="600">
                  {profile.driver_profile.full_name_on_id}
                </DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuIdCard />
                    </Icon>
                    <Text>NID Number</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue fontWeight="600" fontFamily="mono">
                  {profile.driver_profile.nid_number}
                </DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>
                  <HStack gap={2} color="fg.muted">
                    <Icon>
                      <LuCar />
                    </Icon>
                    <Text>License Number</Text>
                  </HStack>
                </DataList.ItemLabel>
                <DataList.ItemValue fontWeight="600" fontFamily="mono">
                  {profile.driver_profile.license_number}
                </DataList.ItemValue>
              </DataList.Item>
              <Separator />
              <DataList.Item>
                <DataList.ItemLabel color="fg.muted">
                  Documents
                </DataList.ItemLabel>
                <DataList.ItemValue>
                  <HStack gap={2}>
                    <Badge colorPalette="green" variant="subtle">
                      NID ✓
                    </Badge>
                    <Badge colorPalette="green" variant="subtle">
                      License ✓
                    </Badge>
                  </HStack>
                </DataList.ItemValue>
              </DataList.Item>
            </DataList.Root>
          </Box>
        )}
        {/* Become a driver prompt */}
        {!loading && !profile?.is_driver && (
          <Box
            bg="blue.50"
            _dark={{ bg: "blue.950" }}
            borderRadius="2xl"
            p={6}
            mb={4}
            borderWidth={1}
            borderColor="blue.200"
          >
            <HStack gap={4}>
              <Box
                bg="blue.100"
                _dark={{ bg: "blue.900" }}
                borderRadius="xl"
                p={3}
                flexShrink={0}
              >
                <Icon color="blue.600" boxSize={6}>
                  <LuCar />
                </Icon>
              </Box>
              <VStack align="start" gap={1} flex={1}>
                <Text fontWeight="700" fontSize="sm">
                  Want to offer rides?
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Post your first ride and automatically become a driver on
                  Pamoja.
                </Text>
              </VStack>
              <Button
                size="sm"
                colorPalette="blue"
                borderRadius="xl"
                onClick={() => navigate("/post")}
              >
                Post a Ride
              </Button>
            </HStack>
          </Box>
        )}
        <Button
          w="full"
          variant="ghost"
          colorPalette="red"
          borderRadius="2xl"
          size="lg"
          onClick={handleLogout}
        >
          <LuLogOut /> Log Out
        </Button>
      </Container>

      {/* Edit drawer */}
      <Drawer.Root
        open={editOpen}
        placement="bottom"
        onOpenChange={(e) => !e.open && setEditOpen(false)}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content borderTopRadius={24} maxH="90vh">
              <Flex justify="center" pt={3} pb={1}>
                <Box w="40px" h="4px" bg="gray.300" borderRadius="full" />
              </Flex>
              <Drawer.Header>
                <Drawer.Title>Edit Profile</Drawer.Title>
                <CloseButton onClick={() => setEditOpen(false)} />
              </Drawer.Header>
              <Drawer.Body overflowY="auto" pb={8}>
                <VStack gap={5}>
                  <Flex justify="center" w="full">
                    <Avatar.Root size="2xl" bg="blue.600">
                      {editData.avatar_url ? (
                        <Avatar.Image src={editData.avatar_url} />
                      ) : (
                        <Avatar.Fallback
                          color="white"
                          fontWeight="800"
                          fontSize="2xl"
                        >
                          {initials}
                        </Avatar.Fallback>
                      )}
                    </Avatar.Root>
                  </Flex>
                  <Separator />
                  <HStack w="full" gap={4}>
                    <Field.Root required flex={1}>
                      <Field.Label>First Name</Field.Label>
                      <Input
                        value={editData.first_name}
                        onChange={(e) =>
                          setEditData((p) => ({
                            ...p,
                            first_name: e.target.value,
                          }))
                        }
                      />
                    </Field.Root>
                    <Field.Root required flex={1}>
                      <Field.Label>Last Name</Field.Label>
                      <Input
                        value={editData.last_name}
                        onChange={(e) =>
                          setEditData((p) => ({
                            ...p,
                            last_name: e.target.value,
                          }))
                        }
                      />
                    </Field.Root>
                  </HStack>
                  <Field.Root w="full">
                    <Field.Label>Email</Field.Label>
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </Field.Root>
                  <Field.Root w="full">
                    <Field.Label>Phone Number</Field.Label>
                    <Input
                      value={editData.phone_number}
                      onChange={(e) =>
                        setEditData((p) => ({
                          ...p,
                          phone_number: e.target.value,
                        }))
                      }
                    />
                  </Field.Root>
                  <Field.Root w="full">
                    <Field.Label>Preferred Language</Field.Label>
                    <Select.Root
                      collection={languageCollection}
                      value={[editData.preferred_language]}
                      onValueChange={(details) =>
                        setEditData((p) => ({
                          ...p,
                          preferred_language: details.value[0] ?? "en",
                        }))
                      }
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText />
                        </Select.Trigger>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {languageCollection.items.map((lang) => (
                              <Select.Item key={lang.value} item={lang}>
                                {lang.icon} {lang.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                </VStack>
              </Drawer.Body>
              <Drawer.Footer gap={3}>
                <Button
                  variant="outline"
                  flex={1}
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="blue"
                  flex={1}
                  loading={saving}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Box>
  );
};
