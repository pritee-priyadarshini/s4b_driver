export type DriverPickupStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COLLECTED'
  | 'CANCELLED';

export type ApiClaimItem = {
  qtyKg?: number;
  quantity?: number;
  qty?: number;
  foodItem: {
    name: string;
    unit?: string;
    category?: string;
  };
};

export type ApiDriverPickup = {
  id: number;
  driverId: number;
  claimId: number;
  listingId: number;
  status: DriverPickupStatus;
  acceptedAt: string;
  arrivedAt?: string | null;
  collectedAt?: string | null;
  cancelledAt?: string | null;
  completionNotes?: string | null;
  restaurantRating?: number | null;
  photoUrl?: string | null;
  claim: {
    id: number;
    claimMode?: string;
    status?: string;
    claimItems: ApiClaimItem[];
    claimantOrg: {
      name: string;
      logoUrl?: string | null;
      address?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    };
  };
  listing: {
    pickupAddress?: string | null;
    pickupLat?: number | null;
    pickupLng?: number | null;
    pickupFromTime?: string | null;
    pickupByTime?: string | null;
    bestBefore?: string | null;
    totalQtyKg?: number | null;
    allergens?: string | null;
    needsRefrigeration?: boolean;
    needsAmbient?: boolean;
    needsFreezer?: boolean;
    needsReheating?: boolean;
    organisation: {
      name: string;
      logoUrl?: string | null;
      address?: string | null;
    };
  };
};

export type LiveDriverInfo = {
  userId: number;
  siteId: number;
  orgId: number;
  name: string;
  phone: string;
  vehicleType: string | null;
  lat: number;
  lng: number;
  deviceToken: string | null;
};

export type GoLivePayload = {
  siteId: number;
  lat: number;
  lng: number;
  vehicleType?: string;
};

export type GoOfflinePayload = {
  siteId: number;
};

export type AcceptPickupPayload = {
  claimId: number;
  listingId: number;
};

export type CompletePickupPayload = {
  notes?: string;
  rating?: number;
  photoUri?: string;
};
