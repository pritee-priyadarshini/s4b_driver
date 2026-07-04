import { create } from 'zustand';

import { driverService } from '../services/driverService';
import type { ApiDriverPickup, DriverPickupStatus } from '../types/driver';
import type { AuthDriver } from '../types/auth';
import {
  mapApiPickupToDashboard,
  mapApiPickupToHistory,
  type DashboardPickup,
} from '../utils/pickupMappers';
import type { HistoryOrder } from '../types/history';

type PickupState = {
  currentPickups: DashboardPickup[];
  pastPickups: HistoryOrder[];
  rawCurrent: ApiDriverPickup[];
  loadingCurrent: boolean;
  loadingPast: boolean;
  actionPickupId: number | null;
  error: string | null;
  fetchCurrentPickups: (
    driver: AuthDriver | null,
    driverLocation?: { latitude: number; longitude: number } | null,
  ) => Promise<void>;
  fetchPastPickups: (driver: AuthDriver | null) => Promise<void>;
  updatePickupStatus: (pickupId: number, status: DriverPickupStatus) => Promise<ApiDriverPickup>;
  completePickup: (pickupId: number) => Promise<ApiDriverPickup>;
  acceptPickup: (claimId: number, listingId: number) => Promise<void>;
  removePickupLocally: (pickupId: number) => void;
  patchPickupLocally: (pickupId: number, patch: Partial<DashboardPickup>) => void;
  clearError: () => void;
};

export const usePickupStore = create<PickupState>((set, get) => ({
  currentPickups: [],
  pastPickups: [],
  rawCurrent: [],
  loadingCurrent: false,
  loadingPast: false,
  actionPickupId: null,
  error: null,

  fetchCurrentPickups: async (driver, driverLocation) => {
    set({ loadingCurrent: true, error: null });
    try {
      const existing = get().currentPickups;
      const res = await driverService.getPickups('current');
      const raw = res.data ?? [];
      set({
        rawCurrent: raw,
        currentPickups: raw.map((pickup) => {
          const mapped = mapApiPickupToDashboard(pickup, driverLocation);
          const prev = existing.find((p) => p.pickupId === pickup.id);
          // Backend has no DELIVERING status — preserve local UI phase across refresh.
          if (prev?.phase === 'delivering' && pickup.status === 'ARRIVED') {
            return { ...mapped, phase: 'delivering' };
          }
          return mapped;
        }),
        loadingCurrent: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load pickups';
      set({ loadingCurrent: false, error: message });
      throw err;
    }
  },

  fetchPastPickups: async (driver) => {
    set({ loadingPast: true, error: null });
    try {
      const res = await driverService.getPickups('past');
      const raw = res.data ?? [];
      set({
        pastPickups: raw.map((pickup) => mapApiPickupToHistory(pickup, driver)),
        loadingPast: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load history';
      set({ loadingPast: false, error: message });
      throw err;
    }
  },

  updatePickupStatus: async (pickupId, status) => {
    set({ actionPickupId: pickupId, error: null });
    try {
      const res = await driverService.updatePickupStatus(pickupId, status);
      set({ actionPickupId: null });
      return res.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update pickup status';
      set({ actionPickupId: null, error: message });
      throw err;
    }
  },

  completePickup: async (pickupId) => {
    set({ actionPickupId: pickupId, error: null });
    try {
      const res = await driverService.completePickup(pickupId);
      set({ actionPickupId: null });
      return res.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to complete pickup';
      set({ actionPickupId: null, error: message });
      throw err;
    }
  },

  acceptPickup: async (claimId, listingId) => {
    set({ error: null });
    try {
      await driverService.acceptPickup({ claimId, listingId });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to accept pickup';
      set({ error: message });
      throw err;
    }
  },

  removePickupLocally: (pickupId) => {
    set((state) => ({
      currentPickups: state.currentPickups.filter((p) => p.pickupId !== pickupId),
      rawCurrent: state.rawCurrent.filter((p) => p.id !== pickupId),
    }));
  },

  patchPickupLocally: (pickupId, patch) => {
    set((state) => ({
      currentPickups: state.currentPickups.map((p) =>
        p.pickupId === pickupId ? { ...p, ...patch } : p,
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));
