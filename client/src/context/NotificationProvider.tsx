import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  NotificationContext,
  type AppNotification,
} from "./notification-context";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const WS_BASE = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register browser push subscription
  usePushNotifications();

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "fetch" }));
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case "UNREAD_COUNT":
          setUnreadCount(msg.count);
          break;
        case "NOTIFICATIONS":
          setNotifications(msg.data);
          break;
        case "NEW_NOTIFICATION":
          setNotifications((prev) => [msg.notification, ...prev]);
          break;
      }
    };

    socket.onclose = () => {
      // eslint-disable-next-line react-hooks/immutability
      reconnectTimer.current = setTimeout(connect, 4000);
    };

    ws.current = socket;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = (data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    send({ action: "fetch" });
  }, []);

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const markAllRead = useCallback(() => {
    send({ action: "mark_all_read" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const markOneRead = useCallback((id: string) => {
    send({ action: "mark_read", id });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        openDrawer,
        closeDrawer,
        markAllRead,
        markOneRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
