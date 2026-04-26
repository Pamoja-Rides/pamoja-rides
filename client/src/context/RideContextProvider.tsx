import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";
import { RideContext, type Ride } from "./ride-context";

const WS_BASE = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";
const API_BASE = import.meta.env.VITE_API_URL;

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);

  // ✅ NEW: booked rides state
  const [bookedRideIds, setBookedRideIds] = useState<Set<string>>(new Set());

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------
  // FETCH MY BOOKINGS (NEW)
  // -----------------------------
  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/rides/my-bookings/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBookedRideIds(new Set(res.data.booked_ride_ids));
    } catch {
      setBookedRideIds(new Set());
    }
  }, []);

  // -----------------------------
  // WS CONNECT (UNCHANGED)
  // -----------------------------
  const connect = useCallback(() => {
    const token = localStorage.getItem("token") ?? "";
    const socket = new WebSocket(`${WS_BASE}/ws/rides/?token=${token}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "fetch_all" }));
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      switch (msg.type) {
        case "ALL_RIDES":
          setRides(msg.data);
          break;

        case "SINGLE_RIDE":
          setRides((prev) => {
            const exists = prev.find((r) => r.id === msg.data.id);
            if (exists) return prev;
            return [msg.data, ...prev];
          });
          break;

        case "broadcast_new_ride":
          setRides((prev) => [msg.data, ...prev]);
          break;

        case "broadcast_seat_update":
          setRides((prev) =>
            prev.map((r) =>
              r.id === msg.ride_id
                ? { ...r, available_seats: msg.available_seats }
                : r,
            ),
          );
          break;

        case "ERROR":
          setWsError(
            msg.message ?? JSON.stringify(msg.errors) ?? "Something went wrong",
          );
          break;
      }
    };

    socket.onclose = () => {
      // eslint-disable-next-line react-hooks/immutability
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.current = socket;
  }, []);

  // -----------------------------
  // INIT
  // -----------------------------
  useEffect(() => {
    connect();
    fetchMyBookings();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect, fetchMyBookings]);

  // -----------------------------
  // WS SEND
  // -----------------------------
  const sendWSMessage = useCallback(
    (action: string, data: Record<string, unknown> = {}) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action, ...data }));
      }
    },
    [],
  );

  // -----------------------------
  // ACTIONS
  // -----------------------------
  const fetchAll = useCallback(
    () => sendWSMessage("fetch_all"),
    [sendWSMessage],
  );

  const bookRide = useCallback(
    (id: string, seats: number) => {
      sendWSMessage("book_ride", { ride_id: id, seats });

      // refresh bookings shortly after booking
      setTimeout(fetchMyBookings, 500);
    },
    [sendWSMessage, fetchMyBookings],
  );

  const clearError = useCallback(() => setWsError(null), []);

  // -----------------------------
  // HELPER
  // -----------------------------
  const isRideBooked = useCallback(
    (id: string) => bookedRideIds.has(id),
    [bookedRideIds],
  );

  // -----------------------------
  // PROVIDER
  // -----------------------------
  return (
    <RideContext.Provider
      value={{
        rides,
        fetchAll,
        bookRide,
        sendWSMessage,
        wsError,
        clearError,

        // ✅ NEW
        bookedRideIds,
        isRideBooked,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};
