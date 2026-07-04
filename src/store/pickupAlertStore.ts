import { create } from 'zustand';

export type PickupAlertData = {
  claimId: string;
  listingId: string;
  title: string;
  body: string;
  type: string;
  claimMode?: string;
  remainingQtyKg?: string;
};

interface PickupAlertState {
  alert: PickupAlertData | null;
  visible: boolean;
  show: (data: PickupAlertData) => void;
  dismiss: () => void;
}

export const usePickupAlertStore = create<PickupAlertState>((set) => ({
  alert: null,
  visible: false,

  show: (data) => set({ alert: data, visible: true }),

  dismiss: () => set({ visible: false, alert: null }),
}));
