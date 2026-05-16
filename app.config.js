import "dotenv/config";

export default {

  expo: {
    name: "S4B Driver",
    slug: "s4b_driver",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: "s4b_driver",
    splash: {
      backgroundColor: "#F6F4EE",
    },
    assetBundlePatterns: [
      "**/*",
    ],

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.s4b.driver",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },

      config: {
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      package: "com.s4b.driver",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],

      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      bundler: "metro",
    },

    plugins: [
      "expo-asset",
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-font",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow Saveful for Business to access your location.",
        },
      ],
    ],

    "extra": {
      "eas": {
        "projectId": "27e91e36-34b9-442d-bc44-7745df8fb81e"
      }
    }
  },
};