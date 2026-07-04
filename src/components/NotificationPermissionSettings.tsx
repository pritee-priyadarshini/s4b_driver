import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { Skeleton } from './Skeleton';
import { useNotificationsStore } from '../store/notificationsStore';
import { useNotificationPrefsStore } from '../store/notificationPrefsStore';
import type { NotificationPermissionState } from '../store/notificationsStore';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';

function getStatusPresentation(state: NotificationPermissionState) {
  if (!state.supported) {
    return {
      label: 'Unavailable',
      description: 'Push notifications need a development or production app build (not Expo Go).',
      tone: 'muted' as const,
      icon: 'information-circle-outline' as const,
    };
  }

  if (state.granted) {
    return {
      label: 'Allowed',
      description: state.firebaseEnabled
        ? 'You will receive pickup assignments and trip updates.'
        : 'Permission is on, but this build is not configured for remote push yet.',
      tone: 'success' as const,
      icon: 'checkmark-circle' as const,
    };
  }

  if (state.status === 'denied' && !state.canAskAgain) {
    return {
      label: 'Blocked',
      description: 'Notifications are turned off in system settings. Open settings to enable them.',
      tone: 'warning' as const,
      icon: 'close-circle' as const,
    };
  }

  return {
    label: 'Not allowed',
    description: 'Turn on notifications to get pickup assignments and trip updates.',
    tone: 'warning' as const,
    icon: 'notifications-off-outline' as const,
  };
}

export function NotificationPermissionSettings() {
  const permission = useNotificationsStore((s) => s.permission);
  const isFetchingPermission = useNotificationsStore((s) => s.isFetchingPermission);
  const isUpdatingPermission = useNotificationsStore((s) => s.isUpdatingPermission);
  const isRegisteringToken = useNotificationsStore((s) => s.isRegisteringToken);
  const error = useNotificationsStore((s) => s.error);
  const lastSuccessAt = useNotificationsStore((s) => s.lastSuccessAt);
  const fetchPermission = useNotificationsStore((s) => s.fetchPermission);
  const enableNotifications = useNotificationsStore((s) => s.enableNotifications);
  const registerDeviceToken = useNotificationsStore((s) => s.registerDeviceToken);
  const openSystemSettings = useNotificationsStore((s) => s.openSystemSettings);

  const alertSoundEnabled = useNotificationPrefsStore((s) => s.alertSoundEnabled);
  const alertVibrationEnabled = useNotificationPrefsStore((s) => s.alertVibrationEnabled);
  const setAlertSound = useNotificationPrefsStore((s) => s.setAlertSound);
  const setAlertVibration = useNotificationPrefsStore((s) => s.setAlertVibration);
  const loadPrefs = useNotificationPrefsStore((s) => s.load);

  useFocusEffect(
    React.useCallback(() => {
      void fetchPermission();
      void loadPrefs();
    }, [fetchPermission, loadPrefs]),
  );

  const presentation = useMemo(
    () => (permission ? getStatusPresentation(permission) : null),
    [permission],
  );

  const showEnableButton =
    permission?.supported && !permission.granted && permission.canAskAgain;
  const showSettingsButton =
    permission?.supported &&
    ((!permission.granted && !permission.canAskAgain) || permission.granted);

  if (isFetchingPermission && !permission) {
    return (
      <View style={styles.loadingWrap}>
        <Skeleton width="100%" height={72} borderRadius={12} />
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
    );
  }

  if (!permission || !presentation) {
    return null;
  }

  const toneStyles =
    presentation.tone === 'success'
      ? styles.statusSuccess
      : presentation.tone === 'warning'
        ? styles.statusWarning
        : styles.statusMuted;

  const toneTextColor =
    presentation.tone === 'success'
      ? palette.kale
      : presentation.tone === 'warning'
        ? palette.orange
        : palette.textMuted;

  return (
    <View style={styles.wrap}>
      <View style={[styles.statusRow, toneStyles]}>
        <Ionicons name={presentation.icon} size={22} color={toneTextColor} />
        <View style={styles.statusCopy}>
          <AppText variant="bodyBold" style={{ color: toneTextColor }}>
            {presentation.label}
          </AppText>
          <AppText variant="bodySmall" color={palette.textMuted}>
            {presentation.description}
          </AppText>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <AppText variant="bodySmall" color={palette.danger}>
            {error}
          </AppText>
          {permission.supported && permission.firebaseEnabled ? (
            <Pressable
              style={[styles.retryBtn, isRegisteringToken && styles.actionBtnDisabled]}
              disabled={isRegisteringToken}
              onPress={() => void registerDeviceToken({ prompt: false })}
            >
              <AppText variant="bodyBold" style={styles.retryBtnText}>
                {isRegisteringToken ? 'Retrying…' : 'Retry registration'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {lastSuccessAt && !error ? (
        <AppText variant="caption" color={palette.kale}>
          Token registered at {new Date(lastSuccessAt).toLocaleTimeString()}
        </AppText>
      ) : null}

      {__DEV__ && permission ? (
        <AppText variant="caption" color={palette.textMuted}>
          Debug: firebaseEnabled={String(permission.firebaseEnabled)} · status={permission.status}
        </AppText>
      ) : null}

      {showEnableButton ? (
        <Pressable
          style={[styles.actionBtn, isUpdatingPermission && styles.actionBtnDisabled]}
          disabled={isUpdatingPermission}
          onPress={() => void enableNotifications()}
        >
          <Ionicons name="notifications-outline" size={18} color={palette.white} />
          <AppText variant="bodyBold" style={styles.actionBtnText}>
            {isUpdatingPermission ? 'Updating...' : 'Turn on notifications'}
          </AppText>
        </Pressable>
      ) : null}

      {showSettingsButton ? (
        <Pressable style={styles.secondaryBtn} onPress={openSystemSettings}>
          <AppText variant="bodyBold" style={styles.secondaryBtnText}>
            {permission.granted ? 'Manage in settings' : 'Open settings'}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={palette.primary} />
        </Pressable>
      ) : null}

      {permission.granted && permission.firebaseEnabled ? (
        <View style={styles.prefsSection}>
          <AppText variant="bodyBold" style={styles.prefsSectionTitle}>
            Pickup Alerts
          </AppText>

          <View style={styles.prefRow}>
            <View style={styles.prefRowLeft}>
              <Ionicons name="volume-high-outline" size={20} color={palette.kale} />
              <View style={styles.prefRowText}>
                <AppText variant="body">Alert Sound</AppText>
                <AppText variant="caption" color={palette.textMuted}>
                  Play notification sound for new pickups
                </AppText>
              </View>
            </View>
            <Switch
              value={alertSoundEnabled}
              onValueChange={setAlertSound}
              trackColor={{ false: palette.strokecream, true: palette.kale + '80' }}
              thumbColor={alertSoundEnabled ? palette.kale : '#f4f3f4'}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefRowLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={palette.kale} />
              <View style={styles.prefRowText}>
                <AppText variant="body">Alert Vibration</AppText>
                <AppText variant="caption" color={palette.textMuted}>
                  Vibrate for 10 seconds on new pickups
                </AppText>
              </View>
            </View>
            <Switch
              value={alertVibrationEnabled}
              onValueChange={setAlertVibration}
              trackColor={{ false: palette.strokecream, true: palette.kale + '80' }}
              thumbColor={alertVibrationEnabled ? palette.kale : '#f4f3f4'}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  loadingWrap: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#E6FFF0',
    borderColor: '#D8EBDF',
  },
  statusWarning: {
    backgroundColor: '#FFF3E4',
    borderColor: '#FFE8CC',
  },
  statusMuted: {
    backgroundColor: '#F5F5F5',
    borderColor: palette.strokecream,
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: 12,
  },
  actionBtnDisabled: {
    opacity: 0.65,
  },
  actionBtnText: {
    color: palette.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: palette.border,
  },
  secondaryBtnText: {
    color: palette.primary,
  },
  errorBox: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.validation,
    backgroundColor: '#FFF0EE',
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.validation,
  },
  retryBtnText: {
    color: palette.validation,
  },
  prefsSection: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.strokecream,
    paddingTop: spacing.md,
  },
  prefsSectionTitle: {
    marginBottom: spacing.xs,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  prefRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  prefRowText: {
    flex: 1,
    gap: 2,
  },
});
