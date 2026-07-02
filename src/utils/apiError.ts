import { Alert } from 'react-native';

type AxiosLikeError = {
  isAxiosError?: boolean;
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

function isAxiosError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosLikeError).isAxiosError === true
  );
}

const TECHNICAL_PATTERNS = [
  /axios/i,
  /network error/i,
  /econnrefused/i,
  /timeout/i,
  /undefined/i,
  /null/i,
  /\[object object\]/i,
  /at \w+\./,
  /Error:/,
  /HTTP \d{3}/i,
];

function humanizeRawMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  if (lower.includes('user not found') || lower.includes('invalid credentials')) {
    return 'Email or password is incorrect. Please try again.';
  }
  if (lower.includes('verify your email') || lower.includes('not verified')) {
    return 'Please verify your email before signing in.';
  }
  if (lower.includes('too many login')) {
    return 'Too many login attempts. Please try again after 15 minutes.';
  }
  if (lower.includes('no organisation found')) {
    return 'No organisation is linked to this account.';
  }

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function extractApiMessage(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === 'string') return humanizeRawMessage(data) || null;

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidate = record.message ?? record.error ?? record.detail ?? record.title;

    if (typeof candidate === 'string') {
      return humanizeRawMessage(candidate) || null;
    }

    if (Array.isArray(record.message) && record.message.length > 0) {
      const first = record.message[0];
      if (typeof first === 'string') {
        return humanizeRawMessage(first) || null;
      }
    }
  }

  return null;
}

export function getLoginErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof Error && error.message === 'NOT_A_DRIVER') {
    return 'This account is not registered as a driver.';
  }

  if (isAxiosError(error)) {
    const apiMessage = extractApiMessage(error.response?.data);
    if (apiMessage) return apiMessage;

    const status = error.response?.status;
    if (status === 401) return 'Email or password is incorrect. Please try again.';
    if (status === 403) return "You don't have permission to sign in with this account.";
    if (status === 429) return 'Too many attempts. Please wait and try again.';
  }

  if (error instanceof Error && error.message) {
    const humanized = humanizeRawMessage(error.message);
    if (humanized) return humanized;
  }

  return fallback;
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isAxiosError(error)) {
    const apiMessage = extractApiMessage(error.response?.data);
    if (apiMessage) return apiMessage;

    const status = error.response?.status;
    if (status === 400) return 'Please check your details and try again.';
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return "You don't have permission to do that.";
    if (status === 404) return "We couldn't find what you're looking for.";
    if (status === 429) return 'Too many attempts. Please wait and try again.';
  }

  if (error instanceof Error && error.message) {
    const humanized = humanizeRawMessage(error.message);
    if (humanized) return humanized;
  }

  return fallback;
}

export function showSuccessAlert(message: string, title = 'Success') {
  Alert.alert(title, message);
}

export function showErrorAlert(
  error: unknown,
  fallback: string,
  title = 'Error',
) {
  Alert.alert(title, getUserFriendlyErrorMessage(error, fallback));
}

export function getForgotPasswordErrorMessage(error: unknown): string {
  return getUserFriendlyErrorMessage(
    error,
    'Could not send reset code. Please try again.',
  );
}

export function getForgotPasswordSuccessMessage(message?: string) {
  return message || 'A reset code has been sent to your email.';
}

export function getOtpVerificationErrorMessage(
  error: unknown,
  fallback = 'Could not verify the code. Please try again.',
): string {
  return getUserFriendlyErrorMessage(error, fallback);
}
