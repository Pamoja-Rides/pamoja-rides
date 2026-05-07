import { useEffect, useRef } from "react";
import axios from "axios";
import { baseUrl } from "@/main";

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const usePushNotifications = () => {
  const subscribed = useRef(false);

  useEffect(() => {
    // Only run once, only in supported browsers, only when logged in
    if (
      subscribed.current ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !localStorage.getItem("token")
    ) {
      return;
    }

    const setup = async () => {
      try {
        // 1. Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // 2. Get VAPID public key from backend
        const { data } = await axios.get(
          `${baseUrl}/notifications/push/vapid-key/`,
        );
        const vapidPublicKey: string = data.public_key;
        if (!vapidPublicKey) return;

        // 3. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // 4. Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const json = subscription.toJSON();
        const p256dh = json.keys?.p256dh;
        const auth = json.keys?.auth;

        if (!p256dh || !auth) return;

        // 5. Send subscription to backend
        await axios.post(
          `${baseUrl}/notifications/push/subscribe/`,
          {
            endpoint: subscription.endpoint,
            p256dh,
            auth,
          },
          authHeader(),
        );

        subscribed.current = true;
      } catch (err) {
        // Permission denied or browser doesn't support — fail silently
        console.warn("Push notification setup failed:", err);
      }
    };

    setup();
  }, []);
};
