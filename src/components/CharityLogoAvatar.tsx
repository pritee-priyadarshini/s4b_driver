import React, { useState } from 'react';
import {
  Image,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { AppText } from './AppText';
import { palette } from '../theme/colors';
import { normalize } from '../utils/responsive';

type Props = {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function CharityLogoAvatar({
  logoUrl,
  name,
  size = normalize(52),
  style,
}: Props) {
  const [failed, setFailed] = useState(false);
  const uri = logoUrl?.trim() || null;
  const showImage = Boolean(uri) && !failed;
  const initial = (name?.trim()?.[0] || 'S').toUpperCase();

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <AppText style={[styles.fallback, { fontSize: size * 0.38 }]}>
          {initial}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: palette.black,
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    color: palette.primary,
    fontWeight: 'bold',
  },
});
