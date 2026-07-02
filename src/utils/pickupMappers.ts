import type { ApiDriverPickup, DriverPickupStatus } from '../types/driver';
import type { HistoryOrder, OrderStatus } from '../types/history';
import type { AuthDriver } from '../types/auth';

export type TripPhase = 'assigned' | 'to_pickup' | 'to_charity';

export type DashboardPickupItem = {
  name: string;
  qty: number;
};

export type DashboardPickup = {
  id: string;
  pickupId: number;
  claimId: number;
  listingId: number;
  title: string;
  address: string;
  contact: string;
  distance: string;
  items: DashboardPickupItem[];
  date: string;
  time: string;
  storage: string;
  latitude: number;
  longitude: number;
  phase: TripPhase;
  backendStatus: DriverPickupStatus;
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPickupWindow(from?: string | null, to?: string | null): string {
  const fromLabel = formatTime(from);
  const toLabel = formatTime(to);
  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel}`;
  return fromLabel || toLabel || 'Window TBC';
}

function buildStorageLabel(pickup: ApiDriverPickup): string {
  const flags: string[] = [];
  const listing = pickup.listing;
  if (listing.needsRefrigeration) flags.push('Refrigeration required');
  if (listing.needsFreezer) flags.push('Freezer required');
  if (listing.needsAmbient) flags.push('Ambient storage');
  if (listing.needsReheating) flags.push('Reheating required');
  return flags.join(' · ') || '';
}

function mapClaimItems(pickup: ApiDriverPickup): DashboardPickupItem[] {
  const items = pickup.claim.claimItems ?? [];
  if (items.length > 0) {
    return items.map((item) => ({
      name: item.foodItem.name,
      qty: item.quantity ?? item.qty ?? 0,
    }));
  }

  if (pickup.listing.totalQtyKg != null) {
    return [{ name: 'Food collection', qty: pickup.listing.totalQtyKg }];
  }

  return [];
}

export function statusToTripPhase(status: DriverPickupStatus): TripPhase {
  if (status === 'EN_ROUTE') return 'to_pickup';
  if (status === 'ARRIVED') return 'to_charity';
  return 'assigned';
}

export function tripPhaseToStatus(phase: TripPhase): DriverPickupStatus {
  if (phase === 'to_pickup') return 'EN_ROUTE';
  if (phase === 'to_charity') return 'ARRIVED';
  return 'ACCEPTED';
}

function distanceLabel(
  driverLat?: number | null,
  driverLng?: number | null,
  targetLat?: number | null,
  targetLng?: number | null,
): string {
  if (
    driverLat == null ||
    driverLng == null ||
    targetLat == null ||
    targetLng == null
  ) {
    return '—';
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(targetLat - driverLat);
  const dLng = toRad(targetLng - driverLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(driverLat)) *
      Math.cos(toRad(targetLat)) *
      Math.sin(dLng / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function mapApiPickupToDashboard(
  pickup: ApiDriverPickup,
  driverLocation?: { latitude: number; longitude: number } | null,
): DashboardPickup {
  const lat = pickup.listing.pickupLat ?? 0;
  const lng = pickup.listing.pickupLng ?? 0;

  return {
    id: String(pickup.id),
    pickupId: pickup.id,
    claimId: pickup.claimId,
    listingId: pickup.listingId,
    title: pickup.listing.organisation.name,
    address: pickup.listing.pickupAddress ?? pickup.listing.organisation.address ?? '',
    contact: '',
    distance: distanceLabel(driverLocation?.latitude, driverLocation?.longitude, lat, lng),
    items: mapClaimItems(pickup),
    date: formatDate(pickup.listing.pickupFromTime ?? pickup.acceptedAt),
    time: formatPickupWindow(pickup.listing.pickupFromTime, pickup.listing.pickupByTime),
    storage: buildStorageLabel(pickup),
    latitude: lat,
    longitude: lng,
    phase: statusToTripPhase(pickup.status),
    backendStatus: pickup.status,
  };
}

function mapHistoryStatus(status: DriverPickupStatus): OrderStatus {
  if (status === 'COLLECTED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'ARRIVED' || status === 'EN_ROUTE') return 'Picked';
  return 'Assigned';
}

export function mapApiPickupToHistory(
  pickup: ApiDriverPickup,
  driver: AuthDriver | null,
): HistoryOrder {
  const charitySite = driver?.profile.sites[0];
  const charityOrg = driver?.profile.organisation;

  return {
    id: String(pickup.id),
    orderId: `#S4B-${pickup.claimId}`,
    status: mapHistoryStatus(pickup.status),
    assignedDate: formatDate(pickup.acceptedAt),
    assignedTime: formatTime(pickup.acceptedAt),
    deliveredDate: formatDate(pickup.collectedAt ?? pickup.cancelledAt),
    deliveredTime: formatTime(pickup.collectedAt ?? pickup.cancelledAt),
    restaurant: {
      name: pickup.listing.organisation.name,
      address: pickup.listing.pickupAddress ?? pickup.listing.organisation.address ?? '',
    },
    charity: {
      name: pickup.claim.claimantOrg.name ?? charitySite?.name ?? charityOrg?.name ?? 'Charity',
      address:
        pickup.claim.claimantOrg.address ??
        charitySite?.address ??
        charityOrg?.address ??
        '',
    },
    items: mapClaimItems(pickup),
    driverRating: 0,
    restaurantRating: pickup.restaurantRating ?? 0,
  };
}

export function getDriverSiteId(driver: AuthDriver | null): number | null {
  return driver?.siteAccess?.siteId ?? driver?.profile.sites[0]?.id ?? null;
}
