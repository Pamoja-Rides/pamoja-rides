import { create } from "zustand";
import { persist } from "zustand/middleware";
// TODO: Implement language zustand store

type UserVerificationState = {
  verificationData: Record<string, string>;
  setVerificationData: (email: string) => void;
};

export const useVerifyUserStore = create<UserVerificationState>()(
  persist(
    (set) => ({
      verificationData: { email: "" },
      setVerificationData: (email: string) =>
        set({ verificationData: { email } }),
    }),
    { name: "verification-store" },
  ),
);
