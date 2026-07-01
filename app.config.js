import "dotenv/config";

const { existsSync } = require('fs');

const withAndroidFirebaseNotificationManifest = require('./plugins/withAndroidFirebaseNotificationManifest');

const GOOGLE_SERVICES_ANDROID = './google-services.json';
const GOOGLE_SERVICES_IOS = './GoogleService-Info.plist';

function resolveGoogleServicesFile(defaultPath, envPath) {
  if (envPath && existsSync(envPath)) return envPath;
  if (existsSync(defaultPath)) return defaultPath;
  return undefined;
}

const androidGoogleServicesFile = resolveGoogleServicesFile(
  GOOGLE_SERVICES_ANDROID,
  process.env.GOOGLE_SERVICES_JSON,
);
const iosGoogleServicesFile = resolveGoogleServicesFile(
  GOOGLE_SERVICES_IOS,
  process.env.GOOGLE_SERVICES_PLIST,
);

function shouldIncludeFirebasePlugins() {
  const platform = process.env.EAS_BUILD_PLATFORM;
  if (platform === 'android') return Boolean(androidGoogleServicesFile);
  if (platform === 'ios') return Boolean(iosGoogleServicesFile);
  return Boolean(androidGoogleServicesFile || iosGoogleServicesFile);
}

const includeFirebase = shouldIncludeFirebasePlugins();

if (
  process.env.EAS_BUILD &&
  process.env.EAS_BUILD_PLATFORM === 'android' &&
  !androidGoogleServicesFile
) {
  throw new Error(
    '[app.config] Android EAS build requires google-services.json. ' +
      'Add google-services.json or set GOOGLE_SERVICES_JSON for EAS file env.',
  );
}

if (includeFirebase) {
  console.log('[app.config] Firebase enabled', {
    android: Boolean(androidGoogleServicesFile),
    ios: Boolean(iosGoogleServicesFile),
    platform: process.env.EAS_BUILD_PLATFORM ?? 'local',
  });
}

const firebasePlugins = includeFirebase
  ? ['@react-native-firebase/app', '@react-native-firebase/messaging']
  : [];

const expoNotificationsPlugin = includeFirebase
  ? [
      'expo-notifications',
      {
        icon: './assets/intro/logo.png',
        color: '#9B8AFB',
      },
    ]
  : ['expo-notifications'];

export default {
  expo: {
    name: 'Saveful Driver',
    slug: 'saveful_driver_app',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    scheme: 'saveful_driver_app',
    splash: {
      backgroundColor: '#F6F4EE',
    },
    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.saveful.driver.app',
      ...(iosGoogleServicesFile && { googleServicesFile: iosGoogleServicesFile }),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      package: 'com.saveful.driver.app',
      ...(androidGoogleServicesFile && { googleServicesFile: androidGoogleServicesFile }),
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
        'android.permission.POST_NOTIFICATIONS',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      bundler: 'metro',
    },

    plugins: [
      'expo-asset',
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      'expo-font',
      expoNotificationsPlugin,
      ...firebasePlugins,
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Allow Saveful Driver to access your location while you are on a live shift.',
          locationAlwaysAndWhenInUsePermission:
            'Allow Saveful Driver to keep sharing your location in the background while you are live, so routing stays accurate until you go offline.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      withAndroidFirebaseNotificationManifest,
    ],

    extra: {
      eas: {
        projectId: '27e91e36-34b9-442d-bc44-7745df8fb81e',
      },
      firebaseEnabled: includeFirebase,
    },
  },
};
