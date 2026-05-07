import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { RideContext, type Ride } from "./ride-context";
import { baseUrl } from "@/main";
import { getCurrentUserId } from "@/utils/auth.util";

const WS_BASE = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [singleRide, setSingleRide] = useState<Ride | null>(null);
  const [bookedRideIds, setBookedRideIds] = useState<Set<string>>(new Set());
  const [wsError, setWsError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshBookings = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get<{ booked_ride_ids: string[] }>(
        `${baseUrl}/rides/my-bookings/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBookedRideIds(new Set(res.data.booked_ride_ids));
    } catch {
      // non-critical
    }
  }, []);

  const connect = useCallback(() => {
    const token = localStorage.getItem("token") ?? "";
    const socket = new WebSocket(`${WS_BASE}/ws/rides/?token=${token}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "fetch_all" }));
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const currentUserId = getCurrentUserId();

      switch (msg.type) {
        case "ALL_RIDES":
          setRides(msg.data);
          break;
        case "SINGLE_RIDE":
          setSingleRide(msg.data);
          break;
        case "RIDE_POSTED":
          // Confirmation back to the driver — don't add to rides list
          // The Rides page will refetch from REST on mount
          break;
        case "broadcast_new_ride": {
          const currentUserId = getCurrentUserId();
          // Skip if this ride was posted by the current user
          if (msg.data?.driver?.id === currentUserId) break;
          setRides((prev) => {
            // Skip if this ride ID is already in the list (deduplication safety net)
            if (prev.some((r) => r.id === msg.data.id)) return prev;
            return [msg.data, ...prev];
          });
          break;
        }
        case "broadcast_seat_update":
          setRides((prev) =>
            prev.map((r) =>
              r.id === msg.ride_id
                ? { ...r, available_seats: msg.available_seats }
                : r,
            ),
          );
          break;
        case "broadcast_ride_cancelled":
          setRides((prev) => prev.filter((r) => r.id !== msg.ride_id));
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

  useEffect(() => {
    connect();
    refreshBookings();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect, refreshBookings]);

  const sendWSMessage = useCallback(
    (action: string, data: Record<string, unknown> = {}) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action, ...data }));
      }
    },
    [],
  );

  const fetchAll = useCallback(
    () => sendWSMessage("fetch_all"),
    [sendWSMessage],
  );
  const fetchRide = useCallback(
    (rideId: string) => sendWSMessage("fetch_one", { ride_id: rideId }),
    [sendWSMessage],
  );
  const bookRide = useCallback(
    (id: string, seats: number) =>
      sendWSMessage("book_ride", { ride_id: id, seats }),
    [sendWSMessage],
  );
  const isRideBooked = useCallback(
    (rideId: string) => bookedRideIds.has(rideId),
    [bookedRideIds],
  );
  const clearError = useCallback(() => setWsError(null), []);

  return (
    <RideContext.Provider
      value={{
        rides,
        singleRide,
        bookedRideIds,
        isRideBooked,
        fetchAll,
        fetchRide,
        bookRide,
        refreshBookings,
        sendWSMessage,
        wsError,
        clearError,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};
