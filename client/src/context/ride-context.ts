import { createContext, useContext } from "react";

export interface Ride {
  id: string;
  origin: string;
  destination: string;
  pickup_point: string;
  available_seats: number;
  departure_datetime: string;
  car_model: string;
  license_plate: string;
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  price_per_seat: string;
}

interface RideContextType {
  rides: Ride[];
  fetchAll: () => void;
  bookRide: (id: string, seats: number) => void;
  sendWSMessage: (action: string, data?: Record<string, unknown>) => void;
  wsError: string | null;
  clearError: () => void;

  // ✅ NEW
  bookedRideIds: Set<string>;
  isRideBooked: (id: string) => boolean;
}

export const RideContext = createContext<RideContextType | undefined>(
  undefined,
);

// ✅ THIS WAS MISSING
export const useRide = () => {
  const context = useContext(RideContext);

  if (!context) {
    throw new Error("useRide must be used within RideProvider");
  }

  return context;
};
