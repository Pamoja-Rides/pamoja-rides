import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newDatetime: string) => Promise<void>;
  saving: boolean;
}

export const RescheduleModal = ({
  open,
  onClose,
  onConfirm,
  saving,
}: RescheduleModalProps) => {
  const [dateValue, setDateValue] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!dateValue) {
      setError("Please pick a date and time.");
      return;
    }
    const picked = new Date(dateValue);
    if (picked <= new Date()) {
      setError("Please pick a time in the future.");
      return;
    }
    setError("");
    await onConfirm(picked.toISOString());
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" maxW="sm" p={2}>
            <Dialog.Header>
              <VStack align="start" gap={0}>
                <Dialog.Title>Update Departure Time</Dialog.Title>
                <Text fontSize="xs" color="fg.muted">
                  The original departure time has passed. Pick a new one to
                  reactivate this ride.
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Field.Root invalid={!!error}>
                  <Field.Label>New departure date & time</Field.Label>
                  <Input
                    type="datetime-local"
                    value={dateValue}
                    onChange={(e) => {
                      setDateValue(e.target.value);
                      setError("");
                    }}
                  />
                  {error && <Field.ErrorText>{error}</Field.ErrorText>}
                </Field.Root>

                <Text fontSize="xs" color="orange.600">
                  Note: any previous bookings on this ride will be cleared.
                  Passengers will be notified and can rebook if they still need
                  a seat.
                </Text>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} flex={1}>
                Cancel
              </Button>
              <Button
                colorPalette="blue"
                flex={2}
                loading={saving}
                onClick={handleConfirm}
              >
                Save & Reactivate
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
