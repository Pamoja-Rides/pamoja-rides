import { createContext, useContext } from "react";

export interface RideStop {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  order: number;
}

export interface Ride {
  id: string;
  origin: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination: string;
  destination_lat: number | null;
  destination_lng: number | null;
  pickup_point: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  stops: RideStop[];
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
  status: string;
  created_at: string;
}

interface RideContextType {
  rides: Ride[];
  singleRide: Ride | null;
  bookedRideIds: Set<string>;
  isRideBooked: (rideId: string) => boolean;
  fetchAll: () => void;
  fetchRide: (rideId: string) => void;
  bookRide: (id: string, seats: number) => void;
  refreshBookings: () => Promise<void>;
  sendWSMessage: (action: string, data?: Record<string, unknown>) => void;
  wsError: string | null;
  clearError: () => void;
}

export const RideContext = createContext<RideContextType | undefined>(
  undefined,
);

export const useRide = (): RideContextType => {
  const context = useContext(RideContext);
  if (!context) throw new Error("useRide must be used inside RideProvider");
  return context;
};
