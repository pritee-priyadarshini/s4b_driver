import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '../components/AppText';
import { Screen } from '../components/Screen';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card } from '../components/Card';
import { InputField } from '../components/InputField';
import { useAuth } from '../store/AuthContext';
import { useSubmitLock } from '../hooks/useSubmitLock';
import { profileService } from '../services/profileService';
import { AuthDriver } from '../types/auth';
import { Skeleton } from '../components/Skeleton';
import { showAppConfirm, showAppError, showAppSuccess, showErrorAlert } from '../utils/appAlert';
import { NotificationPermissionSettings } from '../components/NotificationPermissionSettings';
import { hp, normalize } from '../utils/responsive';

type SectionKey = 'personal' | 'contact' | 'notifications' | 'driver';

type ProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  organisationName: string;
  siteName: string;
  siteAddress: string;
  siteRole: string;
};

const PROFILE_LINKS = [
  {
    label: 'Privacy Policy',
    url: 'https://www.saveful.com/privacy-policy',
  },
  {
    label: 'Terms of Service',
    url: 'https://www.saveful.com/saveful-for-business-terms-conditions',
  },
  {
    label: 'FAQ',
    url: 'https://www.saveful.com/faq#saveful-for-business-faq',
  },
] as const;

function buildFormFromDriver(driver: AuthDriver): ProfileFormData {
  const primarySite = driver.profile.sites[0];

  return {
    firstName: driver.firstName,
    lastName: driver.lastName,
    email: driver.email,
    mobile: driver.phoneNumber,
    organisationName: driver.profile.organisation?.name ?? '',
    siteName: driver.siteAccess?.siteName ?? primarySite?.name ?? '',
    siteAddress: driver.siteAccess?.address ?? primarySite?.address ?? '',
    siteRole: driver.siteRole ?? primarySite?.siteRole ?? 'DRIVER',
  };
}

function formatSinceDate(driver: AuthDriver): string {
  const rawCreatedAt =
    driver.profile.organisation?.createdAt ??
    driver.profile.user.memberSince;

  if (!rawCreatedAt) return '';

  if (typeof rawCreatedAt === 'number') {
    return `Saveful for Business since ${rawCreatedAt}`;
  }

  const parsed = new Date(rawCreatedAt);
  if (Number.isNaN(parsed.getTime())) return '';

  return `Saveful for Business since ${parsed.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })}`;
}

export function ProfileScreen() {
  const { driver, logout, refreshProfile, loading } = useAuth();
  const navigation = useNavigation<any>();
  const { submitting, withLock } = useSubmitLock();
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    organisationName: '',
    siteName: '',
    siteAddress: '',
    siteRole: 'DRIVER',
  });

  useEffect(() => {
    if (driver) {
      setFormData(buildFormFromDriver(driver));
    }
  }, [driver]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProfile = async () => {
        try {
          setRefreshing(true);
          await refreshProfile();
        } catch (error) {
          if (active) {
            console.log('PROFILE REFRESH ERROR', error);
          }
        } finally {
          if (active) {
            setRefreshing(false);
          }
        }
      };

      loadProfile();

      return () => {
        active = false;
      };
    }, [refreshProfile]),
  );

  const updateField = <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggle = (key: SectionKey) => {
    setOpenSection(openSection === key ? null : key);
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showAppError('Error', 'Cannot open this link.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showAppError('Error', 'Something went wrong.');
    }
  };

  const handleUpdatePersonal = async () => {
    if (submitting) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showAppError('Validation', 'First name and last name are required.');
      return;
    }

    await withLock(async () => {
      try {
        if (!driver?.id) {
          showAppError('Error', 'User not found');
          return;
        }

        await profileService.updateProfile(driver.id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        });
        await refreshProfile();
        showAppSuccess('Personal details updated');
      } catch (error) {
        showErrorAlert(error, 'Could not update personal details', 'Update failed');
      }
    });
  };

  const handleUpdateContact = async () => {
    if (submitting) return;

    if (!formData.mobile.trim()) {
      showAppError('Validation', 'Mobile number is required.');
      return;
    }

    await withLock(async () => {
      try {
        if (!driver?.id) {
          showAppError('Error', 'User not found');
          return;
        }

        await profileService.updateProfile(driver.id, {
          mobile: formData.mobile.trim(),
        });
        await refreshProfile();
        showAppSuccess('Contact details updated');
      } catch (error) {
        showErrorAlert(error, 'Could not update contact', 'Update failed');
      }
    });
  };

  const handleLogout = () => {
    showAppConfirm('Logout', 'Are you sure you want to logout?', {
      confirmText: 'Logout',
      destructive: true,
      onConfirm: logout,
    });
  };

  const handleDelete = () => {
    showAppError(
      'Delete Account',
      'Account deletion is not available in the app yet. Please contact support if you need help.',
    );
  };

  const displayName = `${formData.firstName} ${formData.lastName}`.trim() || 'Driver';
  const sinceLabel = driver ? formatSinceDate(driver) : 'Saveful for Business';

  if (loading && !driver) {
    return (
      <Screen scrollable={false} backgroundColor={palette.creme} transparentTop>
        <ProfileSkeleton />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} backgroundColor={palette.creme} transparentTop>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/placeholder/feed-bg.png')}
            style={styles.headerBg}
          />
          <StatusBar style="light" />

          <View style={styles.headerContent}>
            <View style={styles.headerTextBlock}>
              <AppText variant="heading" style={styles.white} numberOfLines={2}>
                {displayName}
              </AppText>

              <AppText variant="caption" style={styles.white} numberOfLines={1}>
                {sinceLabel}
              </AppText>
            </View>

            <View style={styles.profileCircle}>
              <AppText variant="h5">
                {formData.firstName?.charAt(0)?.toUpperCase() || 'D'}
              </AppText>
            </View>
          </View>

          {refreshing ? (
            <View style={styles.refreshingBadge}>
              <View style={styles.refreshingDot} />
            </View>
          ) : null}

          <View style={styles.helpOverlay}>
            <Card style={styles.helpCard}>
              <AppText variant="body" style={{ textAlign: 'center' }}>
                Need a hand?
              </AppText>

              <View style={styles.centerDivider} />

              <AppText variant="bodySmall">
                We're here to help! If you need a hand with anything in the app,
                or have any questions feel free to reach out and we'll help out.
              </AppText>

              <Pressable
                style={styles.supportBtn}
                onPress={() => openLink('https://www.saveful.com/contact')}
              >
                <AppText variant="label">Contact Support</AppText>
              </Pressable>
            </Card>
          </View>
        </View>

        <View style={styles.content}>
          {(['personal', 'contact', 'notifications', 'driver'] as SectionKey[]).map((key) => (
            <View key={key}>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => toggle(key)}
              >
                <AppText variant="bodyLarge">
                  {key === 'personal'
                    ? 'Personal Details'
                    : key === 'contact'
                      ? 'Contact Details'
                      : key === 'notifications'
                        ? 'Notifications'
                        : 'Charity Details'}
                </AppText>

                <Ionicons
                  name={openSection === key ? 'remove' : 'add'}
                  size={18}
                />
              </Pressable>

              {openSection === key && (
                <Card style={styles.accordionContent}>
                  {key === 'personal' && (
                    <>
                      <InputField
                        label="First Name"
                        value={formData.firstName}
                        onChangeText={(value) => updateField('firstName', value)}
                      />
                      <InputField
                        label="Last Name"
                        value={formData.lastName}
                        onChangeText={(value) => updateField('lastName', value)}
                      />

                      <Pressable
                        style={[styles.saveBtn, submitting && { opacity: 0.65 }]}
                        disabled={submitting}
                        onPress={handleUpdatePersonal}
                      >
                        <AppText variant="label" style={{ color: palette.white }}>
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </AppText>
                      </Pressable>
                    </>
                  )}

                  {key === 'contact' && (
                    <>
                      <InputField
                        label="Email"
                        value={formData.email}
                        editable={false}
                      />
                      <InputField
                        label="Mobile"
                        value={formData.mobile}
                        onChangeText={(value) => updateField('mobile', value)}
                      />

                      <View style={{ marginTop: spacing.sm }}>
                        <AppText variant="label">Password</AppText>

                        <Pressable
                          style={styles.passwordButton}
                          onPress={() => navigation.navigate('ChangePassword')}
                        >
                          <View style={styles.passwordLeft}>
                            <Ionicons
                              name="lock-closed-outline"
                              size={18}
                              color={palette.primary}
                            />
                            <AppText variant="bodyBold">Change Password</AppText>
                          </View>

                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={palette.stone}
                          />
                        </Pressable>
                      </View>
                    </>
                  )}

                  {key === 'notifications' && <NotificationPermissionSettings />}

                  {key === 'driver' && (
                    <>
                      <AppText variant="bodySmall" style={styles.readOnlyNote}>
                        Organisation and site details are managed by your admin.
                      </AppText>

                      <InputField
                        label="Organisation"
                        value={formData.organisationName}
                        editable={false}
                      />
                      <InputField
                        label="Assigned Site"
                        value={formData.siteName}
                        editable={false}
                      />
                      <InputField
                        label="Site Address"
                        value={formData.siteAddress}
                        editable={false}
                      />
                      <InputField
                        label="Role"
                        value={formData.siteRole}
                        editable={false}
                      />
                    </>
                  )}

                  {key === 'contact' && (
                    <Pressable
                      style={[styles.saveBtn, submitting && { opacity: 0.65 }]}
                      disabled={submitting}
                      onPress={handleUpdateContact}
                    >
                      <AppText variant="label" style={{ color: palette.white }}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </AppText>
                    </Pressable>
                  )}
                </Card>
              )}
            </View>
          ))}

          {PROFILE_LINKS.map((item) => (
            <Pressable
              key={item.label}
              style={styles.linkRow}
              onPress={() => openLink(item.url)}
            >
              <AppText variant="bodyLarge">{item.label}</AppText>
              <Ionicons name="open-outline" size={18} />
            </Pressable>
          ))}

          <Pressable style={styles.actionBtn} onPress={handleLogout}>
            <AppText variant="label">Log out</AppText>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleDelete}>
            <AppText variant="label">Delete my account</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.wrap}>
      <Skeleton width="100%" height={hp(28)} borderRadius={0} />
      <View style={skeletonStyles.content}>
        <View style={skeletonStyles.helpCard}>
          <Skeleton width="50%" height={normalize(18)} borderRadius={normalize(6)} style={skeletonStyles.centered} />
          <Skeleton width="100%" height={normalize(1)} borderRadius={0} />
          <Skeleton width="100%" height={normalize(48)} borderRadius={normalize(8)} />
          <Skeleton width="70%" height={normalize(40)} borderRadius={normalize(12)} style={skeletonStyles.centered} />
        </View>

        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={skeletonStyles.section}>
            <Skeleton width="42%" height={normalize(18)} borderRadius={normalize(6)} />
            <Skeleton width="100%" height={normalize(52)} borderRadius={normalize(12)} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: hp(25),
  },
  headerBg: {
    width: '100%',
    height: '100%',
  },
  headerContent: {
    position: 'absolute',
    top: hp(5),
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  refreshingBadge: {
    position: 'absolute',
    top: 20,
    right: spacing.md,
  },
  refreshingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.white,
    opacity: 0.85,
  },
  helpOverlay: {
    position: 'absolute',
    bottom: -70,
    left: spacing.xl,
    right: spacing.xl,
  },
  helpCard: {
    padding: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
    gap: spacing.sm,
  },
  centerDivider: {
    width: '96%',
    height: 1,
    backgroundColor: palette.border,
  },

  content: {
    marginTop: 80,
    padding: spacing.md,
    marginHorizontal: spacing.sm,
  },

  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.radish,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  white: {
    color: palette.white,
  },

  accordionHeader: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderColor: palette.border,
  },

  accordionContent: {
    padding: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: 12,
  },

  passwordButton: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    backgroundColor: palette.white,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  passwordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  saveBtn: {
    marginTop: spacing.sm,
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },

  linkRow: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderColor: palette.border,
  },

  actionBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },

  supportBtn: {
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },

  readOnlyNote: {
    color: palette.stone,
    marginBottom: spacing.sm,
  },
});

const skeletonStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: palette.creme,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    marginTop: -hp(8),
  },
  helpCard: {
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
  },
  centered: {
    alignSelf: 'center',
  },
  section: {
    gap: spacing.sm,
  },
});
