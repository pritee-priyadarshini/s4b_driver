const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Restrict Google Play distribution to phone form-factors.
 * iOS phone-only is handled by `ios.supportsTablet: false` in app.config.
 */
function withPhoneOnlyDevices(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Exclude large / xlarge screens (typical tablets) from Play eligibility.
    manifest['supports-screens'] = [
      {
        $: {
          'android:smallScreens': 'true',
          'android:normalScreens': 'true',
          'android:largeScreens': 'false',
          'android:xlargeScreens': 'false',
          'android:anyDensity': 'true',
          'android:resizeable': 'false',
          'android:requiresSmallestWidthDp': '320',
        },
      },
    ];

    // Mark non-phone form factors as unsupported.
    const features = [
      { name: 'android.hardware.touchscreen', required: true },
      { name: 'android.software.leanback', required: false },
      { name: 'android.hardware.type.automotive', required: false },
      { name: 'android.hardware.type.pc', required: false },
    ];

    const existing = Array.isArray(manifest['uses-feature'])
      ? manifest['uses-feature']
      : manifest['uses-feature']
        ? [manifest['uses-feature']]
        : [];

    for (const feature of features) {
      const item = existing.find((f) => f?.$?.['android:name'] === feature.name);
      if (item?.$) {
        item.$['android:required'] = feature.required ? 'true' : 'false';
      } else {
        existing.push({
          $: {
            'android:name': feature.name,
            'android:required': feature.required ? 'true' : 'false',
          },
        });
      }
    }

    manifest['uses-feature'] = existing;
    return config;
  });
}

module.exports = withPhoneOnlyDevices;
