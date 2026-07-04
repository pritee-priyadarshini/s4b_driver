import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { usePickupAlertStore, type PickupAlertData } from '../store/pickupAlertStore';
import { usePickupStore } from '../store/pickupStore';
import { useNotificationPrefsStore } from '../store/notificationPrefsStore';
import { startPickupAlert, stopPickupAlert } from '../utils/pickupAlert';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';

const ACCENT = palette.kale;

export function PickupAlertModal() {
  const visible = usePickupAlertStore((s) => s.visible);
  const alert = usePickupAlertStore((s) => s.alert);
  const dismiss = usePickupAlertStore((s) => s.dismiss);
  const acceptPickup = usePickupStore((s) => s.acceptPickup);
  const fetchCurrentPickups = usePickupStore((s) => s.fetchCurrentPickups);
  const insets = useSafeAreaInsets();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const acceptingRef = useRef(false);

  useEffect(() => {
    if (!visible || !alert) return;

    const vibration = useNotificationPrefsStore.getState().alertVibrationEnabled;
    startPickupAlert({ vibration });

    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 65,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    return () => {
      pulse.stop();
      stopPickupAlert();
    };
  }, [visible, alert, pulseAnim, slideAnim]);

  const handleAccept = async () => {
    if (!alert || acceptingRef.current) return;
    acceptingRef.current = true;
    stopPickupAlert();

    try {
      await acceptPickup(Number(alert.claimId), Number(alert.listingId));
      dismiss();
      void fetchCurrentPickups(null);
    } catch {
      // pickupStore.error is set — dashboard will show it
    } finally {
      acceptingRef.current = false;
    }
  };

  const handleDecline = () => {
    stopPickupAlert();
    dismiss();
  };

  if (!visible || !alert) return null;

  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              paddingTop: insets.top + hp(2),
              paddingBottom: insets.bottom + hp(2),
              transform: [{ translateY: slideTranslate }],
            },
          ]}
        >
          <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="car" size={normalize(40)} color={palette.white} />
          </Animated.View>

          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <AppText variant="caption" style={styles.badgeText}>
              {alert.type === 'pickup_available' ? 'Pickup Ready' : 'New Pickup'}
            </AppText>
          </View>

          <AppText variant="h5" style={styles.title}>
            {alert.title}
          </AppText>

          <AppText variant="body" color={palette.stone} style={styles.body}>
            {alert.body}
          </AppText>

          <AlertInfoRow alert={alert} />

          <Pressable
            style={styles.acceptBtn}
            onPress={() => void handleAccept()}
          >
            <Ionicons name="checkmark-circle" size={normalize(22)} color={palette.white} />
            <AppText variant="bodyBold" style={styles.acceptBtnText}>
              Accept Pickup
            </AppText>
          </Pressable>

          <Pressable style={styles.declineBtn} onPress={handleDecline}>
            <AppText variant="bodyBold" style={styles.declineBtnText}>
              Decline
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function AlertInfoRow({ alert }: { alert: PickupAlertData }) {
  const chips: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [];

  if (alert.remainingQtyKg) {
    chips.push({ icon: 'scale-outline', label: `${alert.remainingQtyKg} kg` });
  }
  if (alert.claimMode) {
    const mode = alert.claimMode === 'FULL' ? 'Full claim' : 'Partial claim';
    chips.push({ icon: 'basket-outline', label: mode });
  }

  if (chips.length === 0) return null;

  return (
    <View style={styles.chipRow}>
      {chips.map((chip) => (
        <View key={chip.label} style={styles.chip}>
          <Ionicons name={chip.icon} size={normalize(16)} color={ACCENT} />
          <AppText variant="bodySmall" style={styles.chipText}>
            {chip.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  card: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: normalize(24),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    gap: hp(1.5),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 16 },
    }),
  },
  iconCircle: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.5),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: '#E6FFF0',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: '#D8EBDF',
  },
  badgeDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: ACCENT,
  },
  badgeText: {
    color: ACCENT,
    fontWeight: '600',
    textTransform: 'none',
  },
  title: {
    textAlign: 'center',
    textTransform: 'none',
    color: palette.black,
  },
  body: {
    textAlign: 'center',
    lineHeight: normalize(22),
    textTransform: 'none',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: '#F2F8F4',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: normalize(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8EBDF',
  },
  chipText: {
    color: ACCENT,
    fontWeight: '500',
    textTransform: 'none',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    width: '100%',
    backgroundColor: ACCENT,
    paddingVertical: hp(2),
    borderRadius: normalize(16),
    marginTop: hp(1),
  },
  acceptBtnText: {
    color: palette.white,
    fontSize: normalize(17),
    textTransform: 'none',
  },
  declineBtn: {
    width: '100%',
    paddingVertical: hp(1.5),
    borderRadius: normalize(16),
    borderWidth: 1.5,
    borderColor: palette.strokecream,
    alignItems: 'center',
  },
  declineBtnText: {
    color: palette.stone,
    fontSize: normalize(15),
    textTransform: 'none',
  },
});
