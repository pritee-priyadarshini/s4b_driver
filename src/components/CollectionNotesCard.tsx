import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';

export function getCollectionNotes(value?: string | null) {
  const text = String(value ?? '').trim();
  return text || null;
}

type Props = {
  notes?: string | null;
  style?: StyleProp<ViewStyle>;
};

/** Hidden when the restaurant left notes empty. */
export function CollectionNotesCard({ notes, style }: Props) {
  const text = getCollectionNotes(notes);
  if (!text) return null;

  return (
    <View style={[styles.card, style]}>
      <Ionicons name="document-text" size={normalize(18)} color={palette.kale} />
      <View style={styles.copy}>
        <AppText variant="caption" style={styles.label}>
          Collection notes
        </AppText>
        <AppText variant="bodySmall" style={styles.body}>
          {text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2.5),
    backgroundColor: '#F2F8F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C8E0D2',
    borderRadius: normalize(12),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.1),
  },
  copy: {
    flex: 1,
    gap: hp(0.25),
  },
  label: {
    color: palette.kale,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  body: {
    color: palette.black,
    textTransform: 'none',
    lineHeight: normalize(19),
  },
});
