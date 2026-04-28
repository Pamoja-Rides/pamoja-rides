import React, { createContext } from "react";

export interface StopData {
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface PostRideData {
  origin: string;
  origin_lat: number | null;
  origin_lng: number | null;
  stops: StopData[];
  destination: string;
  destination_lat: number | null;
  destination_lng: number | null;
  pickup_point: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  departure_datetime: string;
  car_model: string;
  license_plate: string;
  available_seats: number;
  nid_number: string;
  license_number: string;
  full_name_on_id: string;
  nid_image_url: string;
  license_image_url: string;
  driver_phone: string;
  notes?: string;
  price_per_seat: number;
}

interface PostRideContextType {
  formData: PostRideData;
  setFormData: React.Dispatch<React.SetStateAction<PostRideData>>;
}

export const PostRideContext = createContext<PostRideContextType | undefined>(
  undefined,
);
