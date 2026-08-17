import { useState, type ReactNode } from "react";
import { PostRideContext, type PostRideData } from "./postRide-context";

const EMPTY_FORM: PostRideData = {
  origin: "",
  origin_lat: null,
  origin_lng: null,
  stops: [],
  destination: "",
  destination_lat: null,
  destination_lng: null,
  pickup_point: "",
  pickup_lat: null,
  pickup_lng: null,
  departure_datetime: "",
  car_model: "",
  license_plate: "",
  available_seats: 2,
  price_per_seat: 0,
  nid_number: "",
  license_number: "",
  full_name_on_id: "",
  nid_image_url: "",
  license_image_url: "",
  driver_phone: "",
  notes: "",
  ai_verified_same_person: false,
  ai_confidence: "",
  ai_nid_name: "",
  ai_license_name: "",
  identity_flag: false,
  identity_flag_reason: "",
};

export const PostRideProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<PostRideData>(EMPTY_FORM);

  return (
    <PostRideContext.Provider value={{ formData, setFormData }}>
      {children}
    </PostRideContext.Provider>
  );
};
