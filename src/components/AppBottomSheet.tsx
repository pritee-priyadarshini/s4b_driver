import React, { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { modalLayout } from './modalLayout';
import { palette } from '../theme/colors';
import { hp } from '../utils/responsive';

type AppBottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}>;

export function AppBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: AppBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={modalLayout.bottomOverlay}>
        <Pressable style={modalLayout.backdrop} onPress={onClose} accessibilityRole="button" />

        <View style={[modalLayout.bottomSheet, { paddingBottom: insets.bottom + hp(2) }]}>
          <View style={modalLayout.sheetHandle} />

          <ScrollView
            style={modalLayout.bottomSheetScroll}
            contentContainerStyle={modalLayout.bottomSheetContent}
            bounces={false}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {title ? (
              <AppText variant="h6" style={{ textTransform: 'none' }}>
                {title}
              </AppText>
            ) : null}

            {subtitle ? (
              <AppText variant="bodySmall" color={palette.stone}>
                {subtitle}
              </AppText>
            ) : null}

            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
