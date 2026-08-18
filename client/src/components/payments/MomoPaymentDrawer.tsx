import {
  Box,
  Button,
  Drawer,
  Field,
  HStack,
  Input,
  Portal,
  Separator,
  Spinner,
  Text,
  VStack,
  Center,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { baseUrl } from "@/main";
import { toaster } from "@/components/ui/toaster";

export interface EscrowPayment {
  id: string;
  status: "pending" | "successful" | "failed";
  booking: string | null;
  fare_amount: string;
  service_fee: string;
  amount: string;
  escrow_status: "none" | "locked" | "released" | "refunded";
  disbursement_status?: "" | "pending" | "successful" | "failed";
  driver_payout_amount?: string | null;
  arrival_confirmation_requested_at?: string | null;
  pickup_code?: string | null;
  pickup_confirmed_at?: string | null;
}

interface MomoPaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  seats: number;
  farePerSeat: number;
  serviceFee: number;
  onPaid: (payment: EscrowPayment) => void;
}

/**
 * Escrow-lite payment drawer.
 *
 * Charges fare (held for the driver until arrival) + service fee
 * (Pamoja's regardless of outcome) up front via /payments/initiate/.
 * The booking itself is only created server-side once MoMo confirms —
 * this drawer never calls /rides/:id/book/ directly.
 */
export const MomoPaymentDrawer = ({
  open,
  onClose,
  rideId,
  seats,
  farePerSeat,
  serviceFee,
  onPaid,
}: MomoPaymentDrawerProps) => {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "pending" | "successful" | "failed"
  >("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fareTotal = farePerSeat * seats;
  const total = fareTotal + serviceFee;

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current = null;
    timeoutRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  console.log(
    "debug",
    import.meta.env.DEV,
    import.meta.env.VITE_ALLOW_SIMULATE,
    status,
    "result",
    (import.meta.env.DEV || import.meta.env.VITE_ALLOW_SIMULATE === "true") &&
      status !== "successful",
  );
  const startPolling = (id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get<EscrowPayment>(
          `${baseUrl}/payments/${id}/status/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (res.data.status === "successful") {
          stopPolling();
          setStatus("successful");
          toaster.create({
            title: "Payment confirmed",
            description: "Your fare is held until the driver arrives.",
            type: "success",
          });
          onPaid(res.data);
        } else if (res.data.status === "failed") {
          stopPolling();
          setStatus("failed");
          toaster.create({
            title: "Payment failed or was declined",
            type: "error",
          });
        }
      } catch {
        // transient — keep polling
      }
    }, 3000);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setStatus((s) => {
        if (s === "pending") {
          toaster.create({
            title: "Payment timed out. Please try again.",
            type: "error",
          });
          return "failed";
        }
        return s;
      });
    }, 120000);
  };

  const handlePay = async () => {
    if (!phone.trim()) {
      toaster.create({
        title: "Enter the phone number to pay with",
        type: "error",
      });
      return;
    }
    setStatus("submitting");
    try {
      const res = await axios.post<EscrowPayment>(
        `${baseUrl}/payments/initiate/`,
        { ride_id: rideId, seats, phone_number: phone },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setStatus("pending");
      startPolling(res.data.id);
      toaster.create({
        title: "Check your phone",
        description: "Approve the MoMo prompt to confirm your booking.",
        type: "info",
      });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to start payment")
        : "Failed to start payment";
      toaster.create({ title: msg, type: "error" });
      setStatus("idle");
    }
  };

  // Dev-only: initiate payment then immediately confirm it server-side
  // so escrow is properly locked — enabling the full arrival flow in sandbox.
  const handleSimulatePaid = async () => {
    setStatus("submitting");
    try {
      // Step 1 — create the payment record
      const initRes = await axios.post<EscrowPayment>(
        `${baseUrl}/payments/initiate/`,
        { ride_id: rideId, seats, phone_number: phone || "0788000000" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      toaster.create({
        title: "Simulating payment (dev mode)",
        description: "Confirming server-side and locking escrow...",
        type: "info",
      });

      // Step 2 — immediately confirm so status=successful & escrow=locked
      const confirmRes = await axios.post<EscrowPayment>(
        `${baseUrl}/payments/${initRes.data.id}/simulate-success/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      setStatus("successful");
      toaster.create({
        title: "Payment simulated",
        description: "Booking created · escrow locked (dev mode)",
        type: "success",
      });
      onPaid(confirmRes.data);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Simulated payment failed")
        : "Simulated payment failed";
      toaster.create({ title: msg, type: "error" });
      setStatus("idle");
    }
  };

  const handleClose = () => {
    stopPolling();
    setPhone("");
    setStatus("idle");
    onClose();
  };

  return (
    <Drawer.Root
      open={open}
      placement="bottom"
      onOpenChange={(e) => !e.open && handleClose()}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            borderTopRadius="2xl"
            css={{ maxWidth: "480px !important", marginInline: "auto" }}
          >
            <Center pt="3" pb="1">
              <Box
                width="40px"
                height="4px"
                bg="gray.300"
                borderRadius="full"
              />
            </Center>
            <Drawer.Header>
              <Drawer.Title>Confirm & Pay</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body pb={6}>
              <VStack gap={5} align="stretch">
                <Box
                  bg="blue.50"
                  _dark={{ bg: "blue.950" }}
                  borderRadius="xl"
                  p={4}
                >
                  <VStack align="stretch" gap={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="fg.muted">
                        Fare ({farePerSeat.toLocaleString()} × {seats} seat
                        {seats > 1 ? "s" : ""})
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {fareTotal.toLocaleString()} RWF
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="fg.muted">
                        Service fee
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {serviceFee.toLocaleString()} RWF
                      </Text>
                    </HStack>
                    <Separator />
                    <HStack justify="space-between">
                      <Text fontWeight="700">Total</Text>
                      <Text fontWeight="800" fontSize="xl" color="blue.600">
                        {total.toLocaleString()} RWF
                      </Text>
                    </HStack>
                  </VStack>
                  <Text fontSize="xs" color="fg.subtle" mt={2}>
                    Your fare is held until the driver confirms arrival, then
                    released to them automatically.
                  </Text>
                </Box>

                {status === "pending" ? (
                  <HStack
                    w="full"
                    bg="orange.50"
                    _dark={{ bg: "orange.950" }}
                    borderRadius="xl"
                    p={4}
                    gap={3}
                  >
                    <Spinner size="sm" color="orange.500" />
                    <Text fontSize="sm" color="fg.muted">
                      Waiting for MoMo approval on your phone...
                    </Text>
                  </HStack>
                ) : status === "successful" ? (
                  <HStack
                    w="full"
                    bg="green.50"
                    _dark={{ bg: "green.950" }}
                    borderRadius="xl"
                    p={4}
                    gap={3}
                  >
                    <Text
                      fontSize="sm"
                      color="green.700"
                      _dark={{ color: "green.300" }}
                      fontWeight="600"
                    >
                      Payment confirmed
                    </Text>
                  </HStack>
                ) : (
                  <Field.Root>
                    <Field.Label>MoMo number to pay with</Field.Label>
                    <Input
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field.Root>
                )}

                {status !== "successful" && (
                  <Button
                    w="full"
                    size="lg"
                    colorPalette="blue"
                    borderRadius="2xl"
                    loading={status === "submitting" || status === "pending"}
                    onClick={handlePay}
                  >
                    Pay {total.toLocaleString()} RWF via MoMo
                  </Button>
                )}
                {(import.meta.env.DEV ||
                  import.meta.env.VITE_ALLOW_SIMULATE === "true") &&
                  status !== "successful" && (
                    <Button
                      w="full"
                      size="sm"
                      variant="outline"
                      colorPalette="orange"
                      borderRadius="xl"
                      loading={status === "submitting"}
                      onClick={handleSimulatePaid}
                    >
                      🧪 Simulate Payment Success
                    </Button>
                  )}
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
