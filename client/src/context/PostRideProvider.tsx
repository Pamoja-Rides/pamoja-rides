import { useState, type ReactNode } from "react";
import { PostRideContext, type PostRideData } from "./postRide-context";

export const PostRideProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<PostRideData>({
    origin: "",
    destination: "",
    pickup_point: "",
    departure_datetime: "",
    car_model: "",
    license_plate: "",
    available_seats: 1,

    nid_number: "",
    license_number: "",
    full_name_on_id: "",
    nid_image_url: "",
    license_image_url: "",
    driver_phone: "",
    price_per_seat: 0,
  });

  return (
    <PostRideContext.Provider value={{ formData, setFormData }}>
      {children}
    </PostRideContext.Provider>
  );
};
