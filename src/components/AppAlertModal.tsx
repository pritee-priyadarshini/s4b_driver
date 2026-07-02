import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { modalLayout } from './modalLayout';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';
import { useAlertStore, type AppAlertButton, type AppAlertVariant } from '../store/alertStore';

function variantMeta(variant: AppAlertVariant) {
  switch (variant) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        color: palette.kale,
        background: '#E8F3EC',
      };
    case 'error':
      return {
        icon: 'alert-circle' as const,
        color: palette.validation,
        background: '#FFF0EE',
      };
    case 'confirm':
      return {
        icon: 'help-circle' as const,
        color: palette.primary,
        background: palette.primarySoft,
      };
    default:
      return {
        icon: 'information-circle' as const,
        color: palette.primary,
        background: palette.primarySoft,
      };
  }
}

function AlertButton({
  button,
  horizontal,
  onPress,
}: {
  button: AppAlertButton;
  horizontal: boolean;
  onPress: () => void;
}) {
  const isCancel = button.style === 'cancel';
  const isDestructive = button.style === 'destructive';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        horizontal && styles.buttonHorizontal,
        isCancel && styles.buttonCancel,
        isDestructive && styles.buttonDestructive,
        !isCancel && !isDestructive && styles.buttonPrimary,
        pressed && styles.buttonPressed,
      ]}
    >
      <AppText
        variant="bodyBold"
        numberOfLines={2}
        style={[
          styles.buttonText,
          isCancel && styles.buttonTextCancel,
          isDestructive && styles.buttonTextDestructive,
          !isCancel && !isDestructive && styles.buttonTextPrimary,
        ]}
      >
        {button.text}
      </AppText>
    </Pressable>
  );
}

export function AppAlertModal() {
  const visible = useAlertStore((s) => s.visible);
  const variant = useAlertStore((s) => s.variant);
  const title = useAlertStore((s) => s.title);
  const message = useAlertStore((s) => s.message);
  const buttons = useAlertStore((s) => s.buttons);
  const hide = useAlertStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  const meta = variantMeta(variant);
  const horizontalActions = buttons.length > 1;

  const handlePress = (button: AppAlertButton) => {
    hide();
    button.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hide}
    >
      <View
        style={[
          modalLayout.centeredOverlay,
          {
            paddingTop: insets.top + hp(2),
            paddingBottom: insets.bottom + hp(2),
          },
        ]}
      >
        <Pressable style={modalLayout.backdrop} onPress={hide} accessibilityRole="button" />

        <View style={modalLayout.centeredCard}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={message.length > 140}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={modalLayout.centeredBody}
          >
            <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
              <Ionicons name={meta.icon} size={normalize(34)} color={meta.color} />
            </View>

            <AppText variant="h6" style={styles.title}>
              {title}
            </AppText>

            <AppText variant="bodySmall" color={palette.textMuted} style={styles.message}>
              {message}
            </AppText>
          </ScrollView>

          <View
            style={[
              modalLayout.centeredFooter,
              horizontalActions && modalLayout.centeredFooterRow,
            ]}
          >
            {buttons.map((button, index) => (
              <AlertButton
                key={`${button.text}-${index}`}
                button={button}
                horizontal={horizontalActions}
                onPress={() => handlePress(button)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    textTransform: 'none',
    fontSize: normalize(22),
    lineHeight: normalize(28),
    color: palette.black,
  },
  message: {
    textAlign: 'center',
    textTransform: 'none',
    lineHeight: normalize(20),
    paddingHorizontal: wp(1),
    width: '100%',
  },
  button: {
    width: '100%',
    minHeight: normalize(48),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
  },
  buttonHorizontal: {
    flex: 1,
    width: undefined,
  },
  buttonPrimary: {
    backgroundColor: palette.eggplant,
  },
  buttonCancel: {
    backgroundColor: palette.creme,
    borderWidth: 1,
    borderColor: palette.strokecream,
  },
  buttonDestructive: {
    backgroundColor: palette.validation,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    textAlign: 'center',
    textTransform: 'none',
    fontSize: normalize(15),
  },
  buttonTextPrimary: {
    color: palette.white,
  },
  buttonTextCancel: {
    color: palette.primary,
  },
  buttonTextDestructive: {
    color: palette.white,
  },
});
