import { create } from 'zustand';

export type AppAlertVariant = 'success' | 'error' | 'info' | 'confirm';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertState = {
  visible: boolean;
  variant: AppAlertVariant;
  title: string;
  message: string;
  buttons: AppAlertButton[];
  show: (payload: {
    variant?: AppAlertVariant;
    title: string;
    message: string;
    buttons?: AppAlertButton[];
  }) => void;
  hide: () => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  variant: 'info',
  title: '',
  message: '',
  buttons: [{ text: 'OK' }],

  show: ({ variant = 'info', title, message, buttons }) => {
    set({
      visible: true,
      variant,
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    });
  },

  hide: () => {
    set({ visible: false });
  },
}));
