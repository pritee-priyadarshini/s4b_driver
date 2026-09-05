import * as SecureStore from 'expo-secure-store';

/** Driver-scoped keys so they never collide with the business app. */
const REMEMBER_ME_KEY = 'driver_rememberMe';
const REMEMBERED_EMAIL_KEY = 'driver_rememberedEmail';
const REMEMBERED_PASSWORD_KEY = 'driver_rememberedPassword';

const STORE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

export type RememberedCredentials = {
  rememberMe: boolean;
  email: string;
  password: string;
};

export async function loadRememberedCredentials(): Promise<RememberedCredentials> {
  try {
    const [flag, email, password] = await Promise.all([
      SecureStore.getItemAsync(REMEMBER_ME_KEY),
      SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY),
      SecureStore.getItemAsync(REMEMBERED_PASSWORD_KEY),
    ]);

    // Explicit opt-out only. Missing flag → treat as opted in (empty fields until first save).
    const rememberMe = flag !== 'false';

    if (!rememberMe) {
      return { rememberMe: false, email: '', password: '' };
    }

    return {
      rememberMe: true,
      email: (email ?? '').trim(),
      password: password ?? '',
    };
  } catch {
    return { rememberMe: true, email: '', password: '' };
  }
}

export async function saveRememberedCredentials(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await Promise.all([
    SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true', STORE_OPTS),
    SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, normalizedEmail, STORE_OPTS),
    SecureStore.setItemAsync(REMEMBERED_PASSWORD_KEY, password, STORE_OPTS),
  ]);
}

export async function clearRememberedCredentials(): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(REMEMBER_ME_KEY, 'false', STORE_OPTS),
    SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY),
    SecureStore.deleteItemAsync(REMEMBERED_PASSWORD_KEY),
  ]);
}
