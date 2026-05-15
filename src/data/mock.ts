import { Driver, Pickup } from "../types/domain";

export type Credential = {
  email: string;
  password: string;
  driverId: string;
};

export const credentials: Credential[] = [
  {
    email: "driver.raju@seva.org",
    password: "seva123",
    driverId: "drv-001"
  },
  {
    email: "driver.maya@seva.org",
    password: "seva123",
    driverId: "drv-002"
  }
];

export const drivers: Driver[] = [
  {
    id: "drv-001",
    name: "Raju Mehta",
    phone: "+91 98765 43210",
    email: "driver.raju@seva.org",
    avatar: "RM",
    charityId: "chr-001",
    charityName: "Annapurna Foundation",
    vehicle: "Honda Activa",
    plateNumber: "MH 01 DK 4412",
    rating: 4.86,
    completedTrips: 218,
    status: "available"
  },
  {
    id: "drv-002",
    name: "Maya D'Souza",
    phone: "+91 99887 76655",
    email: "driver.maya@seva.org",
    avatar: "MD",
    charityId: "chr-001",
    charityName: "Annapurna Foundation",
    vehicle: "TVS Jupiter",
    plateNumber: "MH 02 FN 9301",
    rating: 4.93,
    completedTrips: 184,
    status: "available"
  }
];

export const pickups: Pickup[] = [
  {
    id: "pck-1001",
    code: "FD-4729",
    status: "assigned",
    priority: "urgent",
    assignedAt: "12:15 PM",
    pickupWindow: "12:40 PM - 1:05 PM",
    etaMinutes: 18,
    distanceKm: 6.2,
    servings: 85,
    restaurant: {
      name: "Green Bowl Kitchen",
      contact: "Priya Nair",
      phone: "+91 90044 10021",
      address: "Shop 12, Bandra Kurla Complex, Mumbai",
      coordinates: {
        latitude: 19.0688,
        longitude: 72.8703,
        label: "Green Bowl Kitchen"
      }
    },
    charity: {
      name: "Annapurna Foundation",
      contact: "Sahil Khan",
      phone: "+91 90111 00988",
      address: "Shelter Hall, Santacruz East, Mumbai",
      coordinates: {
        latitude: 19.0814,
        longitude: 72.8419,
        label: "Annapurna Foundation"
      }
    },
    items: ["Veg biryani trays", "Dal tadka", "Packed rotis", "Bananas"],
    route: [
      { latitude: 19.0649, longitude: 72.8552, label: "Your location" },
      { latitude: 19.0688, longitude: 72.8703, label: "Pickup" },
      { latitude: 19.0739, longitude: 72.8587, label: "Linking Road" },
      { latitude: 19.0814, longitude: 72.8419, label: "Drop" }
    ],
    instructions: [
      "Collect sealed trays from the rear service gate.",
      "Ask restaurant to scan handover code FD-4729.",
      "Keep hot food upright and deliver before 1:30 PM."
    ]
  },
  {
    id: "pck-1002",
    code: "FD-4754",
    status: "assigned",
    priority: "normal",
    assignedAt: "12:25 PM",
    pickupWindow: "1:15 PM - 1:40 PM",
    etaMinutes: 29,
    distanceKm: 9.4,
    servings: 44,
    restaurant: {
      name: "Cafe Sunrise",
      contact: "Amit Shah",
      phone: "+91 88770 01122",
      address: "Ground Floor, Pali Hill, Bandra West, Mumbai",
      coordinates: {
        latitude: 19.0642,
        longitude: 72.8295,
        label: "Cafe Sunrise"
      }
    },
    charity: {
      name: "Hope Meals Trust",
      contact: "Neha Jain",
      phone: "+91 98888 30012",
      address: "Community Centre, Khar West, Mumbai",
      coordinates: {
        latitude: 19.0697,
        longitude: 72.8351,
        label: "Hope Meals Trust"
      }
    },
    items: ["Sandwich boxes", "Fruit cups", "Muffins"],
    route: [
      { latitude: 19.0649, longitude: 72.8552, label: "Your location" },
      { latitude: 19.0642, longitude: 72.8295, label: "Pickup" },
      { latitude: 19.0675, longitude: 72.8323, label: "Carter Road" },
      { latitude: 19.0697, longitude: 72.8351, label: "Drop" }
    ],
    instructions: [
      "Pickup boxes from the cafe counter.",
      "Confirm all dessert boxes are vegetarian.",
      "Call charity contact on arrival."
    ]
  },
  {
    id: "pck-1003",
    code: "FD-4762",
    status: "delivered",
    priority: "normal",
    assignedAt: "10:05 AM",
    pickupWindow: "10:30 AM - 10:55 AM",
    etaMinutes: 0,
    distanceKm: 4.8,
    servings: 62,
    restaurant: {
      name: "Spice Lane",
      contact: "Rohit Verma",
      phone: "+91 91222 44331",
      address: "16th Road, Khar, Mumbai",
      coordinates: {
        latitude: 19.0701,
        longitude: 72.8386,
        label: "Spice Lane"
      }
    },
    charity: {
      name: "Annapurna Foundation",
      contact: "Sahil Khan",
      phone: "+91 90111 00988",
      address: "Shelter Hall, Santacruz East, Mumbai",
      coordinates: {
        latitude: 19.0814,
        longitude: 72.8419,
        label: "Annapurna Foundation"
      }
    },
    items: ["Rice boxes", "Chole", "Curd cups"],
    route: [
      { latitude: 19.0701, longitude: 72.8386, label: "Pickup" },
      { latitude: 19.0814, longitude: 72.8419, label: "Drop" }
    ],
    instructions: ["Delivered with recipient signature."]
  }
];
