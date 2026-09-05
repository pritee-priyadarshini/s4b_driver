import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Screen } from '../components/Screen';
import { AuthStackParamList } from '../navigation/types';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';
import { hp, normalize, wp } from '../utils/responsive';
import { palette } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const valueProps = [
  {
    image: require('../../assets/intro/welcome_reduce_waste.png'),
    label: 'SAVE \n FOOD',
  },
  {
    image: require('../../assets/intro/welcome_feed_communities.png'),
    label: 'FEED \n COMMUNITIES',
  },
  {
    image: require('../../assets/intro/welcome_connect_locally.png'),
    label: 'CONNECT \n LOCALLY',
  },
];

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  useTransparentStatusBar('dark');

  return (
    <Screen backgroundColor={palette.creme} scrollable={false} transparentTop>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Soft brand atmosphere — kept subtle so the card stays the focus */}
      <View pointerEvents="none" style={styles.ambientLayer}>
        <View style={styles.ambientBlobTop} />
        <View style={styles.ambientBlobBottom} />
      </View>

      <View style={styles.topAccent} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + hp(1.2),
            paddingBottom: insets.bottom + hp(2.2),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/intro/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.driverBadge}>
            <AppText variant="h5" color={palette.middlegreen} style={styles.driverLabel}>
              for Drivers
            </AppText>
          </View>

          <View style={styles.truckWrap}>
            <View style={styles.truckGlow} />
            <Image
              source={require('../../assets/intro/driver-logo.png')}
              style={styles.truck}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.contentCard}>
          <Image
            source={require('../../assets/intro/welcome_hero.png')}
            style={styles.heroIllustration}
            resizeMode="cover"
          />

          <View style={styles.actionPanel}>
            <View style={styles.valuePropRow}>
              {valueProps.map((item) => (
                <View key={item.label} style={styles.valuePropItem}>
                  <View style={styles.valuePropIconWrap}>
                    <Image
                      source={item.image}
                      style={styles.valuePropImage}
                      resizeMode="contain"
                    />
                  </View>
                  <AppText
                    variant="caption"
                    color={palette.stone}
                    style={styles.valuePropLabel}
                    numberOfLines={2}
                  >
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <AppText variant="bodyBold" style={styles.primaryButtonText}>
                Log in
              </AppText>
              <View style={styles.primaryButtonArrow}>
                <Ionicons name="arrow-forward" size={normalize(15)} color={palette.white} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.footerBlock}>
          <View style={styles.footerRule} />
          <AppText variant="h5" color={palette.primary} style={styles.footerSlogan}>
            {'HELP GOOD FOOD\nGO FURTHER'}
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  ambientBlobTop: {
    position: 'absolute',
    top: -hp(8),
    right: -wp(18),
    width: wp(58),
    height: wp(58),
    borderRadius: wp(29),
    backgroundColor: 'rgba(150, 240, 182, 0.22)',
  },

  ambientBlobBottom: {
    position: 'absolute',
    bottom: hp(6),
    left: -wp(22),
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: 'rgba(75, 33, 118, 0.06)',
  },

  topAccent: {
    width: '100%',
    height: 3,
    backgroundColor: palette.middlegreen,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    gap: hp(1.8),
  },

  header: {
    alignItems: 'center',
    gap: hp(0.7),
    paddingHorizontal: wp(2),
  },

  logo: {
    width: wp(48),
    height: hp(6.5),
  },

  driverBadge: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.35),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(64, 146, 91, 0.12)',
  },

  driverLabel: {
    textAlign: 'center',
    fontSize: normalize(18),
    lineHeight: normalize(24),
    textTransform: 'none',
    letterSpacing: 0.2,
    fontWeight: '700',
  },

  truckWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.4),
  },

  truckGlow: {
    position: 'absolute',
    bottom: hp(0.4),
    width: wp(36),
    height: hp(2.2),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(75, 33, 118, 0.12)',
  },

  truck: {
    width: wp(48),
    height: hp(11.5),
  },

  contentCard: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: normalize(28),
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(238, 228, 215, 0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#2A1840',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 22,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  heroIllustration: {
    width: '100%',
    height: hp(24.5),
    backgroundColor: palette.creme2,
  },

  actionPanel: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.6),
    paddingBottom: hp(2.1),
    gap: hp(1.7),
    backgroundColor: palette.white,
  },

  valuePropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(1.5),
  },

  valuePropItem: {
    flex: 1,
    alignItems: 'center',
    gap: hp(0.55),
    minWidth: 0,
  },

  valuePropIconWrap: {
    width: normalize(68),
    height: normalize(68),
    borderRadius: normalize(20),
    backgroundColor: palette.creme,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
  },

  valuePropImage: {
    width: normalize(48),
    height: normalize(48),
  },

  valuePropLabel: {
    textAlign: 'center',
    fontSize: normalize(11),
    lineHeight: normalize(13),
    letterSpacing: 0.45,
    fontWeight: '600',
  },

  primaryButton: {
    backgroundColor: palette.eggplant,
    width: '100%',
    minHeight: normalize(54),
    paddingVertical: hp(1.45),
    paddingHorizontal: wp(5),
    borderRadius: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2.2),
    ...Platform.select({
      ios: {
        shadowColor: palette.eggplant,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.32,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  primaryButtonArrow: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: palette.white,
    fontSize: normalize(17),
    textTransform: 'none',
    letterSpacing: 0.25,
  },

  footerBlock: {
    alignItems: 'center',
    gap: hp(1),
    marginTop: hp(0.4),
  },

  footerRule: {
    width: wp(10),
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.middlegreen,
    opacity: 0.75,
  },

  footerSlogan: {
    textAlign: 'center',
    fontSize: normalize(21),
    lineHeight: normalize(27),
    letterSpacing: 1.1,
    fontWeight: '800',
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
