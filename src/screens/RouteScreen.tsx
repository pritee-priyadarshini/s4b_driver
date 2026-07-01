import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { HeroHeader } from '../components/HeroHeader';
import { OsmMapView } from '../components/OsmMapView';

import { palette } from '../theme/colors';
import { PICKUP_THEME } from '../theme/restaurantCardTheme';
import { hp, normalize, wp } from '../utils/responsive';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';

const theme = PICKUP_THEME;

type RouteStatus =
  | 'Assigned'
  | 'Enroute'
  | 'Arrived'
  | 'Picked'
  | 'Verified'
  | 'Completed';

const STEPS: RouteStatus[] = [
  'Assigned',
  'Enroute',
  'Arrived',
  'Picked',
  'Verified',
  'Completed',
];

const MOCK_PICKUP = {
  id: 'S4B-2094',
  status: 'Enroute' as RouteStatus,
  eta: 18,
  distance: '6.4 km',
  restaurant: {
    name: 'Fresh Bowl Kitchen',
    address: 'Koramangala 5th Block, Bangalore',
    phone: '+91 9876543210',
    latitude: 12.9352,
    longitude: 77.6245,
  },
  charity: {
    name: 'Hope Food Foundation',
    address: 'Indiranagar, Bangalore',
    phone: '+91 9123456780',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  pickupDate: '30/06/2026',
  pickupTime: '2:00 PM – 4:00 PM',
  instructions: 'Needs refrigeration',
  items: [
    { name: 'Cooked Rice', qty: 12 },
    { name: 'Bread', qty: 8 },
    { name: 'Dal Curry', qty: 15 },
    { name: 'Packed Meals', qty: 7 },
  ],
};

function getStepIndex(status: RouteStatus) {
  return STEPS.indexOf(status);
}

export function RouteScreen() {
  useTransparentStatusBar('light');

  const pickup = MOCK_PICKUP;
  const currentStep = getStepIndex(pickup.status);

  const restaurant = {
    latitude: pickup.restaurant.latitude,
    longitude: pickup.restaurant.longitude,
  };

  const charity = {
    latitude: pickup.charity.latitude,
    longitude: pickup.charity.longitude,
  };

  const [carCoordinate, setCarCoordinate] = useState(restaurant);

  useEffect(() => {
    if (pickup.status !== 'Enroute') return;

    const route = [
      restaurant,
      {
        latitude: restaurant.latitude + (charity.latitude - restaurant.latitude) * 0.25,
        longitude: restaurant.longitude + (charity.longitude - restaurant.longitude) * 0.25,
      },
      {
        latitude: restaurant.latitude + (charity.latitude - restaurant.latitude) * 0.5,
        longitude: restaurant.longitude + (charity.longitude - restaurant.longitude) * 0.5,
      },
      {
        latitude: restaurant.latitude + (charity.latitude - restaurant.latitude) * 0.75,
        longitude: restaurant.longitude + (charity.longitude - restaurant.longitude) * 0.75,
      },
      charity,
    ];

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      if (index >= route.length) {
        clearInterval(timer);
        return;
      }
      setCarCoordinate(route[index]);
    }, 1200);

    return () => clearInterval(timer);
  }, [pickup.status]);

  const trackerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const segment = (Dimensions.get('window').width - 120) / (STEPS.length - 1);
    Animated.spring(trackerAnim, {
      toValue: segment * currentStep,
      useNativeDriver: true,
    }).start();
  }, [currentStep, trackerAnim]);

  const [modalVisible, setModalVisible] = useState(false);

  const totalQty = useMemo(
    () => pickup.items.reduce((sum, item) => sum + item.qty, 0),
    [pickup.items],
  );

  const makeCall = async (phone?: string | null) => {
    if (!phone) {
      Alert.alert('Unavailable', 'Phone number not available');
      return;
    }
    const clean = phone.replace(/[^+\d]/g, '');
    try {
      await Linking.openURL(`tel:${clean}`);
    } catch {
      Alert.alert('Error', 'Unable to open dialer');
    }
  };

  const sendMessage = async (phone?: string | null) => {
    if (!phone) return;
    await Linking.openURL(`sms:${phone}`);
  };

  const openNavigation = () => {
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${charity.latitude},${charity.longitude}`
        : `google.navigation:q=${charity.latitude},${charity.longitude}`;
    Linking.openURL(url);
  };

  return (
    <Screen backgroundColor={palette.background} contentStyle={styles.container} transparentTop>
      <HeroHeader
        source={require('../../assets/placeholder/kale-header.png')}
        height={hp(18)}
        contentStyle={styles.heroContent}
      >
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <AppText variant="caption" style={styles.heroLabel}>
          ACTIVE DELIVERY
        </AppText>
        <AppText variant="h4" style={styles.headerTitle}>
          {pickup.id}
        </AppText>
        <View style={styles.heroStatsPill}>
          <AppText variant="caption" style={styles.heroStatsText}>
            ETA {pickup.eta}m · {pickup.distance} · {totalQty}kg food
          </AppText>
        </View>
      </HeroHeader>

      <Card style={styles.mapCard}>
        <OsmMapView
          style={styles.map}
          markers={[carCoordinate, restaurant, charity]}
          polyline={[restaurant, charity]}
          initialCenter={restaurant}
          initialZoom={13}
        />
      </Card>

      <Card style={styles.trackCard}>
        <View style={styles.line} />
        <Animated.View
          style={[
            styles.carWrap,
            { transform: [{ translateX: trackerAnim }] },
          ]}
        >
          <MaterialCommunityIcons name="car-sports" size={34} color={theme.accent} />
        </Animated.View>
        <View style={styles.stepRow}>
          {STEPS.map((step, index) => {
            const active = index <= currentStep;
            return (
              <View key={step} style={styles.stepItem}>
                <View style={[styles.stepDot, active && styles.stepDotActive]} />
                <AppText
                  variant="bodySmall"
                  style={[styles.stepText, active && styles.stepTextActive]}
                >
                  {step}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={[styles.detailCard, { borderColor: theme.accent + '40' }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.tag, { backgroundColor: theme.statusBg }]}>
            <AppText style={[styles.tagText, { color: theme.accent }]}>IN PROGRESS</AppText>
          </View>
          <View style={[styles.tagOutline, { borderColor: theme.accent + '80' }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.accent }]} />
            <AppText style={[styles.tagText, { color: theme.accent }]}>{pickup.status.toUpperCase()}</AppText>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" style={styles.cardTitle}>
              Pickup: {pickup.restaurant.name}
            </AppText>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={normalize(13)} color={theme.accent} />
              <AppText variant="bodySmall" color={palette.stone} style={{ flex: 1 }}>
                {pickup.restaurant.address}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.hr} />

        <View style={styles.contactGrid}>
          <View style={styles.contactColumn}>
            <AppText style={styles.contactLabel}>RESTAURANT</AppText>
            <View style={styles.contactActions}>
              <Pressable
                style={[styles.contactActionBtn, { borderColor: theme.accent + '70' }]}
                onPress={() => makeCall(pickup.restaurant.phone)}
              >
                <Ionicons name="call-outline" size={normalize(13)} color={theme.accent} />
                <AppText style={[styles.contactActionText, { color: theme.accent }]}>CALL</AppText>
              </Pressable>
              <Pressable
                style={[styles.contactActionBtn, { borderColor: theme.accent + '70' }]}
                onPress={() => sendMessage(pickup.restaurant.phone)}
              >
                <Ionicons name="chatbubble-outline" size={normalize(13)} color={theme.accent} />
                <AppText style={[styles.contactActionText, { color: theme.accent }]}>MSG</AppText>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.locationCard, { backgroundColor: theme.lightBg, borderColor: theme.accent + '25' }]}>
          <View style={[styles.locationIcon, { backgroundColor: theme.statusBg }]}>
            <Ionicons name="home-outline" size={18} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.locationLabel}>DELIVERY POINT</AppText>
            <AppText variant="bodyBold">{pickup.charity.name}</AppText>
            <AppText variant="bodySmall" color={palette.stone}>{pickup.charity.address}</AppText>
          </View>
          <Pressable
            style={[styles.roundIconBtn, { borderColor: theme.accent + '70' }]}
            onPress={() => makeCall(pickup.charity.phone)}
          >
            <Ionicons name="call-outline" size={18} color={theme.accent} />
          </Pressable>
        </View>

        <View style={styles.detailRow}>
          <Pressable
            style={[styles.detailBox, { flex: 1 }]}
            onPress={() => setModalVisible(true)}
          >
            <View style={[styles.detailIconWrap, { backgroundColor: theme.statusBg }]}>
              <Ionicons name="list-outline" size={normalize(18)} color={theme.accent} />
            </View>
            <View style={styles.detailTextWrap}>
              <AppText style={styles.detailLabel}>ITEMS</AppText>
              <AppText variant="bodyBold" style={styles.detailValue}>View manifest</AppText>
            </View>
          </Pressable>
          <View style={[styles.detailBox, { flex: 1 }]}>
            <View style={[styles.detailIconWrap, { backgroundColor: theme.statusBg }]}>
              <Ionicons name="calendar-outline" size={normalize(18)} color={theme.accent} />
            </View>
            <View style={styles.detailTextWrap}>
              <AppText style={styles.detailLabel}>PICKUP</AppText>
              <AppText variant="bodyBold" style={styles.detailValue} numberOfLines={1}>{pickup.pickupDate}</AppText>
              <AppText variant="bodySmall" color={palette.stone} numberOfLines={1}>{pickup.pickupTime}</AppText>
            </View>
          </View>
        </View>

        <View style={[styles.infoBlock, { backgroundColor: theme.lightBg, borderColor: theme.accent + '35' }]}>
          <AppText variant="caption" color={palette.stone}>Instructions: {pickup.instructions}</AppText>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.primaryBtn, { backgroundColor: theme.accent, flex: 1 }]} onPress={() => {}}>
            <AppText variant="bodyBold" style={styles.primaryBtnText}>Continue Trip</AppText>
            <View style={styles.primaryBtnArrow}>
              <Ionicons name="arrow-forward" size={normalize(17)} color={theme.accent} />
            </View>
          </Pressable>
          <Pressable style={[styles.navBtn, { backgroundColor: theme.accent }]} onPress={openNavigation}>
            <Ionicons name="navigate" size={22} color={palette.white} />
          </Pressable>
        </View>
      </Card>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <AppText variant="subheading">Food Manifest</AppText>
              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={palette.black} />
              </Pressable>
            </View>
            {pickup.items.map((item) => (
              <View key={item.name} style={styles.modalRow}>
                <AppText variant="bodyBold" style={{ flex: 1 }}>{item.name}</AppText>
                <AppText variant="bodySmall">{item.qty}kg</AppText>
              </View>
            ))}
            <AppText variant="bodyBold">Total Quantity: {totalQty} kg</AppText>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: hp(1.6),
    paddingBottom: hp(4),
    paddingHorizontal: wp(4),
    marginTop: -hp(1),
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    gap: hp(0.5),
  },
  heroLabel: {
    color: palette.white,
    opacity: 0.9,
    letterSpacing: 1,
    textTransform: 'none',
  },
  headerTitle: {
    color: palette.white,
    textTransform: 'none',
  },
  heroStatsPill: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(3),
    borderRadius: normalize(20),
    marginTop: hp(0.5),
  },
  heroStatsText: {
    color: palette.white,
    textTransform: 'none',
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: normalize(14),
    borderColor: palette.strokecream,
  },
  map: {
    height: hp(28),
    width: '100%',
  },
  trackCard: {
    padding: wp(4),
    overflow: 'hidden',
    borderRadius: normalize(14),
    borderColor: palette.strokecream,
  },
  line: {
    position: 'absolute',
    top: 34,
    left: 24,
    right: 24,
    height: 4,
    backgroundColor: palette.strokecream,
  },
  carWrap: {
    position: 'absolute',
    top: 18,
    left: 20,
    zIndex: 10,
  },
  stepRow: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    width: 52,
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  stepDotActive: {
    backgroundColor: theme.accent,
  },
  stepText: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 9,
    textTransform: 'none',
  },
  stepTextActive: {
    opacity: 1,
    color: palette.black,
  },
  detailCard: {
    gap: hp(1.2),
    backgroundColor: palette.white,
    borderRadius: normalize(14),
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  tag: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.45),
    borderRadius: normalize(6),
  },
  tagOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.45),
    borderRadius: normalize(6),
    borderWidth: normalize(1),
  },
  tagText: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(10),
    letterSpacing: 0.4,
  },
  statusDot: {
    width: normalize(5),
    height: normalize(5),
    borderRadius: normalize(2.5),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    textTransform: 'none',
    marginBottom: hp(0.5),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(1.5),
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.strokecream,
  },
  contactGrid: {
    flexDirection: 'row',
  },
  contactColumn: {
    flex: 1,
    gap: hp(0.7),
  },
  contactLabel: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(10),
    letterSpacing: 0.8,
    color: palette.stone,
  },
  contactActions: {
    flexDirection: 'row',
    gap: wp(1.5),
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(0.8),
    paddingVertical: hp(0.9),
    borderRadius: normalize(8),
    borderWidth: normalize(1.5),
    backgroundColor: palette.white,
  },
  contactActionText: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(10),
    letterSpacing: 0.4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    borderRadius: normalize(10),
    borderWidth: StyleSheet.hairlineWidth,
    padding: wp(3),
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(9),
    letterSpacing: 0.5,
    color: palette.stone,
    marginBottom: hp(0.2),
  },
  detailRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: '#FAFAF8',
    borderRadius: normalize(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1.1),
    minWidth: 0,
  },
  detailIconWrap: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(9),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: hp(0.12),
  },
  detailLabel: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(9),
    letterSpacing: 0.5,
    color: palette.stone,
  },
  detailValue: {
    textTransform: 'none',
    fontSize: normalize(13),
    color: palette.black,
  },
  infoBlock: {
    borderRadius: normalize(10),
    padding: wp(3),
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.45),
    paddingHorizontal: wp(4),
    borderRadius: normalize(12),
  },
  primaryBtnText: {
    color: palette.white,
    textTransform: 'none',
    fontSize: normalize(15),
    flex: 1,
    textAlign: 'center',
  },
  primaryBtnArrow: {
    width: normalize(30),
    height: normalize(30),
    borderRadius: normalize(15),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  modalCard: {
    backgroundColor: palette.white,
    borderTopLeftRadius: normalize(28),
    borderTopRightRadius: normalize(28),
    padding: wp(5),
    gap: hp(1),
    paddingBottom: hp(5),
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dadbdd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    paddingVertical: hp(0.8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.strokecream,
  },
  roundIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: normalize(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
