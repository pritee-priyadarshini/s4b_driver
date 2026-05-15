export type DriverStatus = "available" | "on-trip" | "offline";

export type PickupStatus =
  | "assigned"
  | "heading-to-restaurant"
  | "picked-up"
  | "delivered";

export type StopKind = "current" | "restaurant" | "charity";

export type RoutePoint = {
  latitude: number;
  longitude: number;
  label: string;
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  charityId: string;
  charityName: string;
  vehicle: string;
  plateNumber: string;
  rating: number;
  completedTrips: number;
  status: DriverStatus;
};

export type Pickup = {
  id: string;
  code: string;
  status: PickupStatus;
  priority: "normal" | "urgent";
  assignedAt: string;
  pickupWindow: string;
  etaMinutes: number;
  distanceKm: number;
  servings: number;
  restaurant: {
    name: string;
    contact: string;
    phone: string;
    address: string;
    coordinates: RoutePoint;
  };
  charity: {
    name: string;
    contact: string;
    phone: string;
    address: string;
    coordinates: RoutePoint;
  };
  items: string[];
  route: RoutePoint[];
  instructions: string[];
};
