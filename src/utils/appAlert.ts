import { Linking } from 'react-native';

import { useAlertStore, type AppAlertButton } from '../store/alertStore';
import { getUserFriendlyErrorMessage } from './apiError';

export function showAppAlert(
  title: string,
  message: string,
  buttons?: AppAlertButton[],
  variant: 'success' | 'error' | 'info' | 'confirm' = 'info',
) {
  useAlertStore.getState().show({ title, message, buttons, variant });
}

export function showAppSuccess(
  message: string,
  title = 'Done',
  onOk?: () => void,
) {
  showAppAlert(
    title,
    message,
    [{ text: 'OK', onPress: onOk }],
    'success',
  );
}

export function showAppError(title: string, message: string) {
  showAppAlert(title, message, [{ text: 'OK' }], 'error');
}

export function showAppConfirm(
  title: string,
  message: string,
  options: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = {},
) {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
  } = options;

  showAppAlert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ],
    'confirm',
  );
}

export function showAppSettingsPrompt(
  title: string,
  message: string,
  options?: { cancelText?: string; confirmText?: string },
) {
  showAppAlert(title, message, [
    {
      text: options?.cancelText ?? 'Not now',
      style: 'cancel',
    },
    {
      text: options?.confirmText ?? 'Open Settings',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ], 'info');
}

export function showErrorFromUnknown(
  error: unknown,
  fallback: string,
  title = 'Something went wrong',
) {
  showAppError(title, getUserFriendlyErrorMessage(error, fallback));
}

export function showSuccessAlert(message: string, title = 'Success', onOk?: () => void) {
  showAppSuccess(message, title, onOk);
}

export function showErrorAlert(
  error: unknown,
  fallback: string,
  title = 'Error',
) {
  showAppError(title, getUserFriendlyErrorMessage(error, fallback));
}
