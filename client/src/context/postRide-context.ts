import React, { createContext } from "react";

export interface PostRideData {
  origin: string;
  destination: string;
  pickup_point: string;
  origin_lat?: number;
  origin_lng?: number;

  destination_lat?: number;
  destination_lng?: number;

  pickup_lat?: number;
  pickup_lng?: number;
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
