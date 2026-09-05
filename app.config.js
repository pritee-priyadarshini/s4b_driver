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
  // Local / Expo config evaluation — enable if either platform config is present.
  return Boolean(androidGoogleServicesFile || iosGoogleServicesFile);
}

const includeFirebase = shouldIncludeFirebasePlugins();

// Fail EAS Android builds early if Firebase client config is missing.
if (
  process.env.EAS_BUILD &&
  process.env.EAS_BUILD_PLATFORM === 'android' &&
  !androidGoogleServicesFile
) {
  throw new Error(
    '[app.config] Android EAS build requires google-services.json via a private EAS file secret.\n' +
      'Run once (from project root, with your local file present):\n' +
      '  npm run eas:firebase-secret\n' +
      'Or manually:\n' +
      '  eas env:create development --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret\n' +
      '  eas env:create preview --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret\n' +
      '  eas env:create production --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret',
  );
}

// Fail EAS iOS builds early if Firebase client config is missing (APNs/FCM).
if (
  process.env.EAS_BUILD &&
  process.env.EAS_BUILD_PLATFORM === 'ios' &&
  !iosGoogleServicesFile
) {
  throw new Error(
    '[app.config] iOS EAS build requires GoogleService-Info.plist via a private EAS file secret.\n' +
      'Download it from Firebase Console for bundle com.saveful.driver.app, then run:\n' +
      '  npm run eas:firebase-secret\n' +
      'Or manually:\n' +
      '  eas env:create development --name GOOGLE_SERVICES_PLIST --type file --value ./GoogleService-Info.plist --visibility secret\n' +
      '  eas env:create preview --name GOOGLE_SERVICES_PLIST --type file --value ./GoogleService-Info.plist --visibility secret\n' +
      '  eas env:create production --name GOOGLE_SERVICES_PLIST --type file --value ./GoogleService-Info.plist --visibility secret',
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

// production / store builds use production APNs; everything else uses development.
const apsEnvironment =
  process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development';

const expoNotificationsPlugin = [
  'expo-notifications',
  {
    ...(includeFirebase
      ? {
          icon: './assets/intro/notification_icon.png',
          color: '#9B8AFB',
        }
      : {}),
    sounds: ['./assets/sounds/pickup_alert.wav'],
    // Required for iOS remote push (aps-environment + UIBackgroundModes).
    mode: apsEnvironment,
    enableBackgroundRemoteNotifications: true,
  },
];

export default {
  expo: {
    name: 'Saveful Driver',
    slug: 'saveful_driver_app',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    scheme: 'saveful_driver_app',
    splash: {
      image: './assets/intro/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#F6F4EE',
    },
    icon: './assets/intro/Saveful-for-Business-logo.png',
    assetBundlePatterns: ['assets/**/*'],

    ios: {
      supportsTablet: false,
      icon: './assets/intro/Saveful-for-Business-logo.png',
      bundleIdentifier: 'com.saveful.driver.app',
      ...(iosGoogleServicesFile && { googleServicesFile: iosGoogleServicesFile }),
      entitlements: {
        'aps-environment': apsEnvironment,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // location is also added by expo-location; keep remote-notification for FCM.
        UIBackgroundModes: ['remote-notification', 'location'],
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      package: 'com.saveful.driver.app',
      adaptiveIcon: {
        foregroundImage: './assets/intro/Saveful-for-Business-logo.png',
        backgroundColor: '#F6F4EE',
      },
      ...(androidGoogleServicesFile && { googleServicesFile: androidGoogleServicesFile }),
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
        'android.permission.POST_NOTIFICATIONS',
        'VIBRATE',
        'android.permission.VIBRATE',
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
      // Firebase iOS (Swift) requires static frameworks or pod install fails.
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
          },
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Saveful Driver needs your location while you are on a live shift to route you to pickups.',
          locationAlwaysAndWhenInUsePermission:
            'Saveful Driver needs "Always" location access so we can keep tracking your route while you are live, even when the app is in the background. Please choose Allow all the time in Settings if prompted.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      ...(includeFirebase ? [withAndroidFirebaseNotificationManifest] : []),
    ],

    extra: {
      eas: {
        projectId: '66c1acb2-e531-4a4e-999d-8d50788f9ead',
      },
      firebaseEnabled: includeFirebase,
    },
  },
};
