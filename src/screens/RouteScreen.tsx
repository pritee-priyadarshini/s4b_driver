import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ImageBackground,
  Modal,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { OsmMapView } from '../components/OsmMapView';

import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';

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
    <Screen backgroundColor={palette.creme} contentStyle={styles.container}>
      <ImageBackground
        source={require('../../assets/placeholder/feed-bg.png')}
        style={styles.headerBg}
        resizeMode="cover"
      >
        <AppText variant="caption" style={styles.heroLabel}>
          ACTIVE DELIVERY
        </AppText>
        <AppText variant="h4" style={styles.headerTitle}>
          {pickup.id}
        </AppText>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}>
            <AppText variant="caption" style={styles.metricCaption}>
              ETA
            </AppText>
            <AppText variant="h5" style={styles.white}>
              {pickup.eta}m
            </AppText>
          </View>
          <View style={styles.heroMetric}>
            <AppText variant="caption" style={styles.metricCaption}>
              DISTANCE
            </AppText>
            <AppText variant="h5" style={styles.white}>
              {pickup.distance}
            </AppText>
          </View>
          <View style={styles.heroMetric}>
            <AppText variant="caption" style={styles.metricCaption}>
              FOOD
            </AppText>
            <AppText variant="h5" style={styles.white}>
              {totalQty}kg
            </AppText>
          </View>
        </View>
      </ImageBackground>

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
          <MaterialCommunityIcons name="car-sports" size={34} color={palette.primary} />
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

      <Card style={styles.detailCard}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">
              Pickup: {pickup.restaurant.name}
            </AppText>
            <AppText variant="bodySmall">📍 {pickup.restaurant.address}</AppText>
            <AppText variant="bodyBold">{pickup.distance}</AppText>
          </View>
          <View style={styles.statusPill}>
            <AppText variant="bodyBold" style={styles.statusPillText}>
              {pickup.status}
            </AppText>
          </View>
        </View>

        <View style={styles.contactRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodySmall">Restaurant contact</AppText>
          </View>
          <View style={styles.iconRow}>
            <Pressable style={styles.iconPill} onPress={() => makeCall(pickup.restaurant.phone)}>
              <Ionicons name="call-outline" size={18} color={palette.white} />
              <AppText variant="bodyBold" style={styles.iconText}>Call</AppText>
            </Pressable>
            <Pressable style={styles.iconPill} onPress={() => sendMessage(pickup.restaurant.phone)}>
              <Ionicons name="chatbubble-outline" size={18} color={palette.white} />
              <AppText variant="bodyBold" style={styles.iconText}>Message</AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="home" size={18} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" style={styles.locationLabel}>
              DELIVERY POINT
            </AppText>
            <AppText variant="bodyBold">{pickup.charity.name}</AppText>
            <AppText variant="bodySmall">📍 {pickup.charity.address}</AppText>
          </View>
          <Pressable style={styles.roundIconBtn} onPress={() => makeCall(pickup.charity.phone)}>
            <Ionicons name="call" size={18} color={palette.primary} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Pressable style={styles.metaCard} onPress={() => setModalVisible(true)}>
            <AppText variant="bodyBold">Items</AppText>
            <View style={styles.viewBtn}>
              <AppText variant="bodyBold" style={styles.viewText}>View</AppText>
            </View>
          </Pressable>
          <View style={styles.metaCard}>
            <AppText variant="bodyBold">Pickup Date</AppText>
            <AppText variant="bodySmall">{pickup.pickupDate}</AppText>
          </View>
          <View style={styles.metaCard}>
            <AppText variant="bodyBold">Pickup Time</AppText>
            <AppText variant="bodySmall">{pickup.pickupTime}</AppText>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <AppText variant="caption">Instructions: {pickup.instructions}</AppText>
        </View>

        <View style={styles.actionRow}>
          <Button label="Continue Trip" style={styles.tripBtn} onPress={() => {}} />
          <Pressable style={styles.navBtn} onPress={openNavigation}>
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
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerBg: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  heroLabel: {
    color: palette.white,
    opacity: 0.9,
    letterSpacing: 1,
  },
  headerTitle: {
    color: palette.white,
  },
  white: {
    color: palette.white,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  heroMetric: {
    alignItems: 'center',
  },
  metricCaption: {
    color: palette.white,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  mapCard: {
    marginHorizontal: spacing.lg,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
  },
  map: {
    height: 240,
    width: '100%',
  },
  trackCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    top: 34,
    left: 24,
    right: 24,
    height: 4,
    backgroundColor: '#ddd',
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
    backgroundColor: palette.middlegreen,
  },
  stepText: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 9,
  },
  stepTextActive: {
    opacity: 1,
    color: palette.black,
  },
  detailCard: {
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: palette.radish,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusPill: {
    backgroundColor: palette.middlegreen,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    color: palette.white,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.middlegreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  iconText: {
    color: palette.white,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.creme,
    borderRadius: 14,
    padding: spacing.sm,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.middlegreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    color: palette.stone,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaCard: {
    flex: 1,
    backgroundColor: palette.creme,
    padding: spacing.sm,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
  },
  viewBtn: {
    backgroundColor: palette.middlegreen,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  viewText: {
    color: palette.white,
  },
  infoBlock: {
    backgroundColor: palette.white,
    borderRadius: 10,
    padding: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  tripBtn: {
    flex: 1,
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
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
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.strokecream,
  },
  roundIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.creme,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
