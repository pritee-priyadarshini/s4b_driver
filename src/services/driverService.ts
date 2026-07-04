import api from './api';
import type {
  AcceptPickupPayload,
  ApiDriverPickup,
  CompletePickupPayload,
  GoLivePayload,
  GoOfflinePayload,
  LiveDriverInfo,
} from '../types/driver';

type GoLiveResponse = {
  message: string;
  driver: LiveDriverInfo;
};

type AcceptPickupResponse = {
  pickup: ApiDriverPickup;
  restaurant: {
    name?: string;
    logoUrl?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    pickupFromTime?: string | null;
    pickupByTime?: string | null;
  };
};

export const driverService = {
  goLive: (data: GoLivePayload) =>
    api.post<GoLiveResponse>('/drivers/live', data),

  goOffline: (data: GoOfflinePayload) =>
    api.delete<{ message: string }>('/drivers/live', { data } as any),

  acceptPickup: (data: AcceptPickupPayload) =>
    api.post<AcceptPickupResponse>('/drivers/pickup/accept', data),

  getPickups: (filter: 'current' | 'past') =>
    api.get<ApiDriverPickup[]>('/drivers/pickups', { params: { filter } }),

  getPickupDetails: (pickupId: number) =>
    api.get<ApiDriverPickup>(`/drivers/pickups/${pickupId}`),

  updatePickupStatus: (pickupId: number, status: string) =>
    api.patch<ApiDriverPickup>(`/drivers/pickups/${pickupId}/status`, { status }),

  completePickup: (pickupId: number, payload: CompletePickupPayload = {}) => {
    const hasAttachment = !!payload.photoUri;

    if (!hasAttachment) {
      const body: Record<string, unknown> = {};
      if (payload.notes) body.notes = payload.notes;
      if (payload.rating != null) body.rating = payload.rating;
      return api.post<ApiDriverPickup>(`/drivers/pickups/${pickupId}/complete`, body);
    }

    const form = new FormData();
    if (payload.notes) form.append('notes', payload.notes);
    if (payload.rating != null) form.append('rating', String(payload.rating));

    const uri = payload.photoUri!;
    const name = uri.split('/').pop() ?? 'pickup-photo.jpg';
    const type = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    form.append('photo', { uri, name, type } as unknown as Blob);

    return api.post<ApiDriverPickup>(`/drivers/pickups/${pickupId}/complete`, form);
  },
};
