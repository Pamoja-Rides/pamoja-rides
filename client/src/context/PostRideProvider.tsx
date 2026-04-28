import { useState, type ReactNode } from "react";
import { PostRideContext, type PostRideData } from "./postRide-context";

export const PostRideProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<PostRideData>({
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
    nid_number: "",
    license_number: "",
    full_name_on_id: "",
    nid_image_url: "",
    license_image_url: "",
    driver_phone: "",
    notes: "",
    price_per_seat: 0,
  });

  return (
    <PostRideContext.Provider value={{ formData, setFormData }}>
      {children}
    </PostRideContext.Provider>
  );
};
