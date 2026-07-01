import { Platform } from 'react-native';

import { palette } from './colors';

export const PICKUP_THEME = {
  accent: palette.kale,
  statusBg: '#D8EBDF',
  lightBg: '#F2F8F4',
  categoryLabel: 'Pickup',
};

export const cardElevation = Platform.select({
  ios: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
});
