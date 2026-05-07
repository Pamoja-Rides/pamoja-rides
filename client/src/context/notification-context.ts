import { createContext } from "react";

export interface AppNotification {
  id: string;
  type:
    | "ride_booked"
    | "ride_full"
    | "ride_edited"
    | "booking_confirmed"
    | "ride_cancelled";
  title: string;
  body: string;
  ride_id: string | null;
  actor_name: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
