import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
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
  onPress,
}: {
  button: AppAlertButton;
  onPress: () => void;
}) {
  const isCancel = button.style === 'cancel';
  const isDestructive = button.style === 'destructive';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isCancel && styles.buttonCancel,
        isDestructive && styles.buttonDestructive,
        !isCancel && !isDestructive && styles.buttonPrimary,
        pressed && styles.buttonPressed,
      ]}
    >
      <AppText
        variant="bodyBold"
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

  const meta = variantMeta(variant);

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
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={hide} accessibilityRole="button" />

        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
            <Ionicons name={meta.icon} size={normalize(34)} color={meta.color} />
          </View>

          <AppText variant="h6" style={styles.title}>
            {title}
          </AppText>

          <AppText variant="bodySmall" color={palette.textMuted} style={styles.message}>
            {message}
          </AppText>

          <View style={[styles.actions, buttons.length > 1 && styles.actionsRow]}>
            {buttons.map((button, index) => (
              <AlertButton
                key={`${button.text}-${index}`}
                button={button}
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
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 27, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: normalize(360),
    backgroundColor: palette.white,
    borderRadius: normalize(24),
    borderWidth: 1,
    borderColor: palette.strokecream,
    paddingHorizontal: wp(5),
    paddingTop: hp(2.4),
    paddingBottom: hp(2),
    alignItems: 'center',
    gap: hp(1),
    ...Platform.select({
      ios: {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrap: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.4),
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
  },
  actions: {
    width: '100%',
    gap: hp(1),
    marginTop: hp(1.2),
  },
  actionsRow: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    minHeight: normalize(48),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(3),
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
