import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  Linking,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Screen } from '../components/Screen';
import { HeroHeader } from '../components/HeroHeader';
import { OsmMapView } from '../components/OsmMapView';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';
import { useAuth } from '../store/AuthContext';
import { useDriverShiftStore } from '../store/driverShiftStore';
import { AuthDriver } from '../types/auth';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';

const ACCENT = palette.kale;
const ACCENT_SOFT = '#D8EBDF';
const ACCENT_LIGHT = '#F2F8F4';
const { width: SCREEN_W } = Dimensions.get('window');

type TripPhase = 'assigned' | 'to_pickup' | 'to_charity';

type PickupItem = { name: string; qty: number };

type Pickup = {
  id: string;
  title: string;
  address: string;
  contact: string;
  distance: string;
  items: PickupItem[];
  date: string;
  time: string;
  storage: string;
  /** Restaurant pickup coordinates */
  latitude: number;
  longitude: number;
  phase: TripPhase;
};

function restaurantCoord(pickup: Pickup): Coord {
  return { latitude: pickup.latitude, longitude: pickup.longitude };
}

function distanceKm(from: Coord, to: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Coord = { latitude: number; longitude: number };

type CharityHub = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const INITIAL_PICKUPS: Pickup[] = [
  {
    id: '1',
    title: 'Pizza Hut',
    address: 'MG Road, Bangalore',
    contact: '+91 98765 43210',
    distance: '2.1 km',
    items: [{ name: 'Bread', qty: 5 }, { name: 'Rice', qty: 10 }],
    date: '12/04/26',
    time: '2:00 PM – 4:00 PM',
    storage: 'Refrigeration required',
    latitude: 12.9716,
    longitude: 77.5946,
    phase: 'assigned',
  },
  {
    id: '2',
    title: 'Welspoon Hotel',
    address: 'Hosur Road, Bangalore',
    contact: '+91 98765 55555',
    distance: '10.1 km',
    items: [{ name: 'Cooked Food', qty: 5 }, { name: 'Rice', qty: 10 }],
    date: '12/04/26',
    time: '5:00 PM – 8:00 PM',
    storage: 'Refrigeration required',
    latitude: 12.9352,
    longitude: 77.6245,
    phase: 'assigned',
  },
  {
    id: '3',
    title: 'Hotel Red Dragon',
    address: 'Marathahalli, Bangalore',
    contact: '+91 98765 11111',
    distance: '8.1 km',
    items: [{ name: 'Cooked Food', qty: 15 }, { name: 'Vegetables', qty: 8 }],
    date: '12/04/26',
    time: '3:00 PM – 6:00 PM',
    storage: 'Refrigeration required',
    latitude: 12.9591,
    longitude: 77.6974,
    phase: 'assigned',
  },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function itemQty(items: PickupItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

function phaseLabel(phase: TripPhase) {
  if (phase === 'assigned') return 'New pickup';
  if (phase === 'to_pickup') return 'Heading to restaurant';
  return 'Heading to charity';
}

function slideLabel(phase: TripPhase) {
  if (phase === 'assigned') return 'Slide to start trip';
  if (phase === 'to_pickup') return 'Slide to confirm pickup';
  return 'Slide to complete delivery';
}

function getCharityHub(driver: AuthDriver | null): CharityHub {
  const site = driver?.profile.sites[0];
  const org = driver?.profile.organisation;

  return {
    name: site?.name ?? org?.name ?? 'Your charity',
    address: driver?.siteAccess?.address ?? site?.address ?? org?.address ?? '',
    latitude: site?.latitude ?? 12.9784,
    longitude: site?.longitude ?? 77.6408,
  };
}

const TOGGLE_TRACK_W = normalize(54);
const TOGGLE_KNOB_SIZE = normalize(26);
const TOGGLE_KNOB_TRAVEL = TOGGLE_TRACK_W - TOGGLE_KNOB_SIZE - normalize(6);

type SlideToActProps = {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
};

function SlideToAct({ label, onComplete, disabled = false }: SlideToActProps) {
  const trackW = useRef(0);
  const thumbX = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);
  const disabledRef = useRef(disabled);
  const onCompleteRef = useRef(onComplete);

  disabledRef.current = disabled;
  onCompleteRef.current = onComplete;

  const reset = () => {
    completed.current = false;
    Animated.spring(thumbX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !disabledRef.current &&
        Math.abs(g.dx) > Math.abs(g.dy) &&
        Math.abs(g.dx) > 4,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !disabledRef.current &&
        Math.abs(g.dx) > Math.abs(g.dy) &&
        Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        if (disabledRef.current || completed.current) return;
        const max = Math.max(trackW.current - normalize(56), 0);
        thumbX.setValue(Math.max(0, Math.min(g.dx, max)));
      },
      onPanResponderRelease: (_, g) => {
        if (disabledRef.current || completed.current) return;
        const max = Math.max(trackW.current - normalize(56), 0);
        if (g.dx > max * 0.75) {
          completed.current = true;
          Animated.timing(thumbX, { toValue: max, duration: 120, useNativeDriver: true }).start(() => {
            onCompleteRef.current();
            setTimeout(reset, 450);
          });
        } else {
          reset();
        }
      },
      onPanResponderTerminate: reset,
    }),
  ).current;

  return (
    <View
      style={[styles.slideTrack, disabled && styles.slideTrackDisabled]}
      onLayout={(e) => {
        trackW.current = e.nativeEvent.layout.width;
      }}
      {...pan.panHandlers}
    >
      <AppText variant="bodyBold" style={styles.slideLabel}>
        {disabled ? 'Go live to start accepting trips' : label}
      </AppText>
      {!disabled ? (
        <Animated.View style={[styles.slideThumb, { transform: [{ translateX: thumbX }] }]}>
          <Ionicons name="chevron-forward" size={normalize(24)} color={palette.white} />
        </Animated.View>
      ) : null}
    </View>
  );
}

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();

  const charityHub = useMemo(() => getCharityHub(driver), [driver]);
  const firstName = driver?.firstName || 'Driver';

  const liveStatus = useDriverShiftStore((s) => s.liveStatus);
  const driverLocation = useDriverShiftStore((s) => s.driverLocation);
  const shiftStartLabel = useDriverShiftStore((s) => s.shiftStartLabel);
  const toggleLive = useDriverShiftStore((s) => s.toggleLive);

  const [pickups, setPickups] = useState(INITIAL_PICKUPS);
  const [foodModal, setFoodModal] = useState<Pickup | null>(null);
  const [activeTrip, setActiveTrip] = useState<Pickup | null>(null);
  const [tripVisible, setTripVisible] = useState(false);

  const toggleAnim = useRef(new Animated.Value(0)).current;

  const isLive = liveStatus === 'live';

  useTransparentStatusBar('light');

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: liveStatus === 'offline' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [liveStatus, toggleAnim]);

  const knobTranslateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOGGLE_KNOB_TRAVEL],
  });

  const handleLiveToggle = async () => {
    if (liveStatus === 'connecting') return;

    const tryingToGoLive = liveStatus === 'offline';
    await toggleLive();

    if (tryingToGoLive && useDriverShiftStore.getState().liveStatus === 'offline') {
      Alert.alert(
        'Location required',
        'Turn on location access so we can route you to pickups and your charity.',
      );
    }
  };

  const sorted = useMemo(
    () =>
      [...pickups].sort((a, b) => {
        const order: TripPhase[] = ['to_charity', 'to_pickup', 'assigned'];
        return order.indexOf(a.phase) - order.indexOf(b.phase);
      }),
    [pickups],
  );

  const updatePickup = (id: string, patch: Partial<Pickup>) => {
    setPickups((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setActiveTrip((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const openTripMap = (pickup: Pickup) => {
    setActiveTrip(pickup);
    setTripVisible(true);
  };

  const handleSlideComplete = (pickup: Pickup) => {
    if (liveStatus !== 'live') {
      Alert.alert('Go live first', 'Turn on Go live before starting a trip.');
      return;
    }

    if (pickup.phase === 'assigned') {
      updatePickup(pickup.id, { phase: 'to_pickup' });
      openTripMap({ ...pickup, phase: 'to_pickup' });
      return;
    }

    if (pickup.phase === 'to_pickup') {
      updatePickup(pickup.id, { phase: 'to_charity' });
      openTripMap({ ...pickup, phase: 'to_charity' });
      return;
    }

    setTripVisible(false);
    setActiveTrip(null);
    setPickups((prev) => prev.filter((p) => p.id !== pickup.id));
  };

  const tripMapConfig = useMemo(() => {
    if (!activeTrip) return null;

    const restaurant = restaurantCoord(activeTrip);
    const charity = { latitude: charityHub.latitude, longitude: charityHub.longitude };
    const driver = driverLocation;

    if (activeTrip.phase === 'to_charity') {
      const markers = driver ? [restaurant, charity, driver] : [restaurant, charity];
      return {
        destination: charity,
        routeOrigin: restaurant,
        destinationLabel: charityHub.name,
        destinationAddress: charityHub.address,
        destinationType: 'charity' as const,
        markers,
        polyline: [restaurant, charity],
        center: restaurant,
      };
    }

    const markers = driver ? [driver, restaurant] : [restaurant];
    return {
      destination: restaurant,
      routeOrigin: driver ?? restaurant,
      destinationLabel: activeTrip.title,
      destinationAddress: activeTrip.address,
      destinationType: 'restaurant' as const,
      markers,
      polyline: driver ? [driver, restaurant] : [restaurant],
      center: driver ?? restaurant,
    };
  }, [activeTrip, charityHub, driverLocation]);

  const tripDistanceKm = useMemo(() => {
    if (!tripMapConfig) return null;
    return distanceKm(tripMapConfig.routeOrigin, tripMapConfig.destination);
  }, [tripMapConfig]);

  const openExternalNav = () => {
    if (!tripMapConfig) return;
    const { latitude, longitude } = tripMapConfig.destination;
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${latitude},${longitude}`
        : `google.navigation:q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const headerLocation = useMemo(() => {
    if (liveStatus === 'offline') {
      return {
        icon: 'moon-outline' as const,
        text: "You're offline",
        pillStyle: styles.locationPillOffline,
        iconColor: 'rgba(255,255,255,0.75)',
      };
    }
    if (liveStatus === 'connecting') {
      return {
        icon: 'locate-outline' as const,
        text: 'Getting your location…',
        pillStyle: styles.locationPillConnecting,
        iconColor: palette.white,
      };
    }
    return {
      icon: 'navigate-circle' as const,
      text: shiftStartLabel ? `Started at ${shiftStartLabel}` : 'Shift location set',
      pillStyle: styles.locationPillLive,
      iconColor: palette.white,
    };
  }, [liveStatus, shiftStartLabel]);

  const renderHeader = () => (
    <HeroHeader
      source={require('../../assets/placeholder/kale-header.png')}
      height={hp(22)}
      style={styles.heroWrap}
      contentStyle={styles.heroContent}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.heroTopRow}>
        <View style={styles.heroTextBlock}>
          <AppText variant="caption" style={styles.heroGreeting}>
            {greeting()}
          </AppText>
          <AppText variant="h6" style={styles.heroName} numberOfLines={1}>
            {firstName}
          </AppText>
          <AppText variant="bodySmall" style={styles.heroOrg} numberOfLines={1}>
            {charityHub.name}
          </AppText>
        </View>
        <View style={styles.logoCircle}>
          <AppText style={styles.logoFallback}>
            {(charityHub.name[0] || 'S').toUpperCase()}
          </AppText>
        </View>
      </View>
      <View style={[styles.locationPill, headerLocation.pillStyle]}>
        {liveStatus === 'connecting' ? (
          <ActivityIndicator size="small" color={palette.white} />
        ) : (
          <Ionicons name={headerLocation.icon} size={normalize(14)} color={headerLocation.iconColor} />
        )}
        <AppText variant="caption" style={styles.locationPillText} numberOfLines={2}>
          {headerLocation.text}
        </AppText>
      </View>
    </HeroHeader>
  );

  const renderLiveCard = () => {
    const cardTitle =
      liveStatus === 'live'
        ? 'You are live'
        : liveStatus === 'connecting'
          ? 'Going live…'
          : 'Go live now';

    const cardSubtitle =
      liveStatus === 'live'
        ? 'Location tracking on · Stays live until you turn off'
        : liveStatus === 'connecting'
          ? 'Finding your starting location'
          : 'Tap to start your shift and share location';

    return (
      <Pressable
        style={[
          styles.liveCard,
          liveStatus === 'live' && styles.liveCardOn,
          liveStatus === 'connecting' && styles.liveCardConnecting,
        ]}
        onPress={handleLiveToggle}
        disabled={liveStatus === 'connecting'}
      >
        <View style={styles.liveLeft}>
          <View
            style={[
              styles.liveIconWrap,
              liveStatus === 'live' && styles.liveIconWrapOn,
              liveStatus === 'connecting' && styles.liveIconWrapConnecting,
            ]}
          >
            {liveStatus === 'connecting' ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <Ionicons
                name={liveStatus === 'live' ? 'radio' : 'radio-outline'}
                size={normalize(22)}
                color={liveStatus === 'live' ? palette.white : ACCENT}
              />
            )}
          </View>
          <View style={styles.liveTextCol}>
            <AppText variant="bodyBold" style={styles.liveTitle}>
              {cardTitle}
            </AppText>
            <AppText variant="bodySmall" color={palette.stone}>
              {cardSubtitle}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.toggleTrack,
            liveStatus !== 'offline' ? styles.toggleOn : styles.toggleOff,
            liveStatus === 'connecting' && styles.toggleConnecting,
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.toggleKnob,
              { transform: [{ translateX: knobTranslateX }] },
              liveStatus === 'connecting' && styles.toggleKnobConnecting,
            ]}
          >
            {liveStatus === 'connecting' ? (
              <ActivityIndicator size="small" color={ACCENT} />
            ) : null}
          </Animated.View>
        </View>
      </Pressable>
    );
  };

  const renderCard = ({ item }: { item: Pickup }) => {
    const qty = itemQty(item.items);
    const isActive = activeTrip?.id === item.id && tripVisible;

    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: ACCENT_SOFT }]}>
            <View style={[styles.statusDot, { backgroundColor: ACCENT }]} />
            <AppText variant="caption" style={{ color: ACCENT }}>
              {phaseLabel(item.phase)}
            </AppText>
          </View>
          <AppText variant="bodyBold" style={styles.distanceText}>
            {item.distance}
          </AppText>
        </View>

        <AppText variant="h6" style={styles.restaurantTitle}>
          {item.title}
        </AppText>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={normalize(18)} color={ACCENT} />
          <AppText variant="bodySmall" color={palette.stone} style={styles.addressText}>
            {item.address}
          </AppText>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={normalize(20)} color={ACCENT} />
            <View style={styles.infoBoxText}>
              <AppText variant="caption" color={palette.stone}>Pickup window</AppText>
              <AppText variant="bodyBold" style={styles.infoValue}>{item.date}</AppText>
              <AppText variant="bodySmall" color={palette.stone}>{item.time}</AppText>
            </View>
          </View>
          <Pressable style={styles.infoBox} onPress={() => setFoodModal(item)}>
            <Ionicons name="basket-outline" size={normalize(20)} color={ACCENT} />
            <View style={styles.infoBoxText}>
              <AppText variant="caption" color={palette.stone}>Food to collect</AppText>
              <AppText variant="bodyBold" style={styles.infoValue}>{qty} kg</AppText>
              <AppText variant="bodySmall" style={{ color: ACCENT }}>
                {item.items.length} items · View
              </AppText>
            </View>
          </Pressable>
        </View>

        {item.storage ? (
          <View style={styles.storageRow}>
            <Ionicons name="snow-outline" size={normalize(16)} color={ACCENT} />
            <AppText variant="bodySmall" color={palette.stone}>{item.storage}</AppText>
          </View>
        ) : null}

        <View style={styles.contactRow}>
          <Pressable
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`tel:${item.contact.replace(/[^+\d]/g, '')}`)}
          >
            <Ionicons name="call-outline" size={normalize(18)} color={ACCENT} />
            <AppText variant="bodyBold" style={{ color: ACCENT }}>Call restaurant</AppText>
          </Pressable>
          <Pressable
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`sms:${item.contact}`)}
          >
            <Ionicons name="chatbubble-outline" size={normalize(18)} color={ACCENT} />
            <AppText variant="bodyBold" style={{ color: ACCENT }}>Message</AppText>
          </Pressable>
        </View>

        <View style={styles.charityNote}>
          <Ionicons name="home-outline" size={normalize(16)} color={palette.stone} />
          <AppText variant="bodySmall" color={palette.stone} style={{ flex: 1 }}>
            Deliver to <AppText variant="bodyBold" style={{ color: palette.black }}>{charityHub.name}</AppText> after pickup
          </AppText>
        </View>

        <SlideToAct
          label={slideLabel(item.phase)}
          disabled={!isLive}
          onComplete={() => handleSlideComplete(item)}
        />
      </View>
    );
  };

  return (
    <Screen scrollable={false} backgroundColor={palette.background} transparentTop>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {renderHeader()}
            <View style={styles.mainContent}>
              {renderLiveCard()}
              <AppText variant="h7" style={styles.sectionTitle}>
                Today&apos;s pickups
              </AppText>
              <AppText variant="bodySmall" color={palette.stone} style={styles.sectionSub}>
                {sorted.length} job{sorted.length !== 1 ? 's' : ''} assigned to you
              </AppText>
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(3) }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: hp(1.6) }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={normalize(52)} color={ACCENT_SOFT} />
            <AppText variant="bodyBold" color={palette.stone}>No pickups right now</AppText>
            <AppText variant="bodySmall" color={palette.stone} style={{ textAlign: 'center' }}>
              Go live and we&apos;ll notify you when a restaurant needs a collection.
            </AppText>
          </View>
        }
      />

      <Modal visible={!!foodModal} transparent animationType="slide" onRequestClose={() => setFoodModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFoodModal(null)}>
          <Pressable style={styles.foodSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <AppText variant="h6" style={styles.sheetTitle}>{foodModal?.title}</AppText>
            <AppText variant="bodySmall" color={palette.stone} style={{ marginBottom: hp(1.5) }}>
              Items to collect from restaurant
            </AppText>
            {foodModal?.items.map((food) => (
              <View key={food.name} style={styles.foodRow}>
                <AppText variant="body" style={{ flex: 1 }}>{food.name}</AppText>
                <AppText variant="bodyBold" color={palette.stone}>{food.qty} kg</AppText>
              </View>
            ))}
            <View style={styles.foodTotal}>
              <AppText variant="bodyBold">Total</AppText>
              <AppText variant="bodyBold">
                {foodModal ? itemQty(foodModal.items) : 0} kg
              </AppText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={tripVisible && !!activeTrip && !!tripMapConfig} animationType="slide" onRequestClose={() => setTripVisible(false)}>
        {activeTrip && tripMapConfig ? (
          <View style={styles.tripRoot}>
            <View style={styles.tripMapSection}>
              <OsmMapView
                key={`${activeTrip.id}-${activeTrip.phase}`}
                style={styles.tripMap}
                markers={tripMapConfig.markers}
                polyline={tripMapConfig.polyline}
                initialCenter={tripMapConfig.center}
                initialZoom={14}
                active
              />

              <View style={[styles.tripTopBar, { paddingTop: insets.top + hp(0.8) }]}>
                <Pressable style={styles.tripTopBtn} onPress={() => setTripVisible(false)}>
                  <Ionicons name="arrow-back" size={normalize(22)} color={palette.black} />
                </Pressable>
                <View style={styles.tripTopCenter}>
                  <AppText variant="bodyBold" style={styles.tripTopTitle} numberOfLines={1}>
                    {activeTrip.title}
                  </AppText>
                  <AppText variant="caption" color={palette.stone} style={styles.tripTopSub}>
                    {phaseLabel(activeTrip.phase)}
                  </AppText>
                </View>
                {driverLocation ? (
                  <View style={styles.tripLiveChip}>
                    <View style={styles.tripLiveDot} />
                    <AppText variant="caption" style={styles.tripLiveText}>Live</AppText>
                  </View>
                ) : (
                  <View style={styles.tripTopBtnPlaceholder} />
                )}
              </View>

              <View style={styles.tripFloatingRow}>
                {tripDistanceKm != null ? (
                  <View style={styles.tripFloatChip}>
                    <Ionicons name="navigate-outline" size={normalize(14)} color={ACCENT} />
                    <AppText variant="caption" style={styles.tripFloatChipText}>
                      {tripDistanceKm < 1
                        ? `${Math.round(tripDistanceKm * 1000)} m away`
                        : `${tripDistanceKm.toFixed(1)} km away`}
                    </AppText>
                  </View>
                ) : null}
                <View style={styles.tripFloatChip}>
                  <Ionicons name="basket-outline" size={normalize(14)} color={ACCENT} />
                  <AppText variant="caption" style={styles.tripFloatChipText}>
                    {itemQty(activeTrip.items)} kg
                  </AppText>
                </View>
              </View>

              <View style={styles.tripSteps}>
                <View
                  style={[
                    styles.tripStep,
                    activeTrip.phase === 'to_pickup' && styles.tripStepActive,
                    activeTrip.phase === 'to_charity' && styles.tripStepDone,
                  ]}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={normalize(16)}
                    color={
                      activeTrip.phase === 'to_charity'
                        ? palette.white
                        : activeTrip.phase === 'to_pickup'
                          ? ACCENT
                          : palette.stone
                    }
                  />
                  <AppText
                    variant="caption"
                    style={[
                      styles.tripStepLabel,
                      activeTrip.phase === 'to_pickup' && styles.tripStepLabelActive,
                      activeTrip.phase === 'to_charity' && styles.tripStepLabelDone,
                    ]}
                  >
                    Pickup
                  </AppText>
                </View>
                <View
                  style={[
                    styles.tripStepLine,
                    activeTrip.phase === 'to_charity' && styles.tripStepLineDone,
                  ]}
                />
                <View
                  style={[
                    styles.tripStep,
                    activeTrip.phase === 'to_charity' && styles.tripStepDone,
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={normalize(16)}
                    color={activeTrip.phase === 'to_charity' ? palette.white : palette.stone}
                  />
                  <AppText
                    variant="caption"
                    style={[
                      styles.tripStepLabel,
                      activeTrip.phase === 'to_charity' && styles.tripStepLabelDone,
                    ]}
                  >
                    Charity
                  </AppText>
                </View>
              </View>
            </View>

            <View style={[styles.tripSheet, { paddingBottom: insets.bottom + hp(2) }]}>
              <View style={styles.tripSheetHandle} />

              <View style={styles.tripDestCard}>
                <View style={[styles.tripDestIcon, { backgroundColor: ACCENT_SOFT }]}>
                  <Ionicons
                    name={tripMapConfig.destinationType === 'charity' ? 'home' : 'restaurant'}
                    size={normalize(24)}
                    color={ACCENT}
                  />
                </View>
                <View style={styles.tripDestBody}>
                  <AppText variant="caption" color={palette.stone}>
                    {tripMapConfig.destinationType === 'charity' ? 'Deliver to charity' : 'Collect from restaurant'}
                  </AppText>
                  <AppText variant="bodyBold" numberOfLines={1}>{tripMapConfig.destinationLabel}</AppText>
                  <AppText variant="bodySmall" color={palette.stone} numberOfLines={2}>
                    {tripMapConfig.destinationAddress}
                  </AppText>
                </View>
              </View>

              <Pressable style={styles.tripNavRow} onPress={openExternalNav}>
                <View style={styles.tripNavIcon}>
                  <Ionicons name="navigate" size={normalize(22)} color={palette.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" style={styles.tripNavTitle}>Open in Maps</AppText>
                  <AppText variant="bodySmall" color={palette.stone}>Turn-by-turn navigation</AppText>
                </View>
                <Ionicons name="chevron-forward" size={normalize(20)} color={palette.stone} />
              </Pressable>

              {driverLocation ? (
                <View style={styles.tripGpsBanner}>
                  <Ionicons name="locate" size={normalize(16)} color={ACCENT} />
                  <AppText variant="bodySmall" color={palette.stone} style={{ flex: 1 }}>
                    GPS active — your position updates on the map as you move.
                  </AppText>
                </View>
              ) : (
                <View style={[styles.tripGpsBanner, styles.tripGpsBannerWarn]}>
                  <Ionicons name="warning-outline" size={normalize(16)} color={palette.chilli} />
                  <AppText variant="bodySmall" color={palette.chilli} style={{ flex: 1 }}>
                    GPS unavailable — go live and enable location for routing.
                  </AppText>
                </View>
              )}

              <SlideToAct
                label={slideLabel(activeTrip.phase)}
                disabled={!isLive}
                onComplete={() => handleSlideComplete(activeTrip)}
              />
            </View>
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: SCREEN_W,
    marginLeft: 0,
    height: hp(22),
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: wp(5),
    justifyContent: 'flex-end',
    paddingBottom: hp(3),
    gap: hp(1.2),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: wp(3),
  },
  heroTextBlock: {
    flex: 1,
    gap: hp(0.3),
    minWidth: 0,
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  heroName: {
    color: palette.white,
    fontSize: normalize(26),
    lineHeight: normalize(34),
    textTransform: 'none',
  },
  heroOrg: {
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'none',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.5),
    paddingVertical: hp(0.65),
    paddingHorizontal: wp(3),
    borderRadius: normalize(20),
    maxWidth: '100%',
  },
  locationPillOffline: {
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  locationPillConnecting: {
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  locationPillLive: {
    backgroundColor: 'rgba(59, 126, 82, 0.45)',
  },
  locationPillText: {
    color: palette.white,
    flexShrink: 1,
    textTransform: 'none',
    flex: 1,
  },
  logoCircle: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: palette.black, shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  logoFallback: {
    color: palette.primary,
    fontWeight: 'bold',
    fontSize: normalize(20),
  },
  mainContent: {
    paddingHorizontal: wp(4),
    marginTop: -hp(1),
    gap: hp(0.4),
  },
  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4),
    marginTop: hp(1.6),
    marginBottom: hp(2),
    borderWidth: 1.5,
    borderColor: palette.strokecream,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  liveCardOn: {
    borderColor: ACCENT + '80',
    backgroundColor: ACCENT_LIGHT,
  },
  liveCardConnecting: {
    borderColor: ACCENT + '50',
    backgroundColor: '#FAFCFA',
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    flex: 1,
    paddingRight: wp(2),
  },
  liveIconWrap: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIconWrapOn: {
    backgroundColor: ACCENT,
  },
  liveIconWrapConnecting: {
    backgroundColor: ACCENT,
  },
  liveTextCol: {
    flex: 1,
    gap: hp(0.25),
  },
  liveTitle: {
    textTransform: 'none',
    fontSize: normalize(16),
  },
  toggleTrack: {
    width: TOGGLE_TRACK_W,
    height: normalize(32),
    borderRadius: normalize(16),
    justifyContent: 'center',
    paddingHorizontal: normalize(3),
  },
  toggleOn: { backgroundColor: ACCENT },
  toggleOff: { backgroundColor: palette.strokecream },
  toggleConnecting: {
    backgroundColor: ACCENT + 'CC',
  },
  toggleKnob: {
    width: TOGGLE_KNOB_SIZE,
    height: TOGGLE_KNOB_SIZE,
    borderRadius: TOGGLE_KNOB_SIZE / 2,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
  toggleKnobConnecting: {
    backgroundColor: palette.white,
  },
  sectionTitle: {
    textTransform: 'none',
    color: palette.black,
  },
  sectionSub: {
    textTransform: 'none',
    marginBottom: hp(1.2),
  },
  card: {
    marginHorizontal: wp(4),
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4.5),
    gap: hp(1.4),
    borderWidth: 1,
    borderColor: palette.strokecream,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  cardActive: {
    borderColor: ACCENT,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: normalize(8),
  },
  statusDot: {
    width: normalize(7),
    height: normalize(7),
    borderRadius: normalize(3.5),
  },
  distanceText: {
    textTransform: 'none',
    color: palette.stone,
    fontSize: normalize(14),
  },
  restaurantTitle: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(22),
    lineHeight: normalize(28),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
  },
  addressText: {
    flex: 1,
    textTransform: 'none',
    lineHeight: normalize(20),
  },
  infoRow: {
    flexDirection: 'row',
    gap: wp(2.5),
  },
  infoBox: {
    flex: 1,
    flexDirection: 'row',
    gap: wp(2.5),
    backgroundColor: '#FAFAF8',
    borderRadius: normalize(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
    padding: wp(3),
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    gap: hp(0.15),
  },
  infoValue: {
    textTransform: 'none',
    fontSize: normalize(15),
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: normalize(10),
  },
  contactRow: {
    flexDirection: 'row',
    gap: wp(2.5),
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1.2),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: ACCENT + '60',
    backgroundColor: palette.white,
  },
  charityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
    paddingTop: hp(0.3),
  },
  slideTrack: {
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: ACCENT,
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: hp(0.5),
  },
  slideTrackDisabled: {
    backgroundColor: palette.strokecream,
  },
  slideLabel: {
    color: palette.white,
    textAlign: 'center',
    textTransform: 'none',
    fontSize: normalize(15),
  },
  slideThumb: {
    position: 'absolute',
    left: normalize(4),
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: hp(1.2),
    paddingVertical: hp(8),
    paddingHorizontal: wp(10),
    marginHorizontal: wp(4),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  foodSheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingHorizontal: wp(5),
    paddingBottom: hp(5),
    paddingTop: hp(1),
  },
  sheetHandle: {
    width: normalize(40),
    height: normalize(4),
    borderRadius: 2,
    backgroundColor: palette.strokecream,
    alignSelf: 'center',
    marginBottom: hp(1.5),
  },
  sheetTitle: {
    textTransform: 'none',
  },
  foodRow: {
    flexDirection: 'row',
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.strokecream,
  },
  foodTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    paddingTop: hp(1.2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.strokecream,
  },
  tripRoot: {
    flex: 1,
    backgroundColor: palette.background,
  },
  tripMapSection: {
    flex: 1,
    position: 'relative',
    minHeight: hp(42),
  },
  tripMap: {
    ...StyleSheet.absoluteFillObject,
  },
  tripTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
    gap: wp(2),
  },
  tripTopBtn: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
  tripTopBtnPlaceholder: {
    width: normalize(44),
  },
  tripTopCenter: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: normalize(14),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.9),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  tripTopTitle: {
    textTransform: 'none',
    fontSize: normalize(15),
  },
  tripTopSub: {
    textTransform: 'none',
  },
  tripLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: ACCENT,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.7),
    borderRadius: normalize(20),
  },
  tripLiveDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: palette.white,
  },
  tripLiveText: {
    color: palette.white,
    textTransform: 'none',
    fontWeight: '600',
  },
  tripFloatingRow: {
    position: 'absolute',
    bottom: hp(2),
    left: wp(4),
    right: wp(4),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tripFloatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: palette.white,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: normalize(20),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  tripFloatChipText: {
    color: palette.black,
    textTransform: 'none',
    fontWeight: '600',
  },
  tripSteps: {
    position: 'absolute',
    bottom: hp(6.5),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: normalize(24),
    gap: wp(2),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  tripStep: {
    alignItems: 'center',
    gap: hp(0.3),
    paddingHorizontal: wp(2),
  },
  tripStepDone: {
    backgroundColor: ACCENT,
    borderRadius: normalize(12),
    paddingVertical: hp(0.4),
  },
  tripStepActive: {
    backgroundColor: ACCENT_SOFT,
    borderRadius: normalize(12),
    paddingVertical: hp(0.4),
  },
  tripStepLabel: {
    textTransform: 'none',
    color: palette.stone,
    fontSize: normalize(10),
  },
  tripStepLabelActive: {
    color: ACCENT,
    fontWeight: '600',
  },
  tripStepLabelDone: {
    color: palette.white,
    fontWeight: '600',
  },
  tripStepLine: {
    width: wp(8),
    height: 2,
    backgroundColor: palette.strokecream,
    borderRadius: 1,
  },
  tripStepLineDone: {
    backgroundColor: ACCENT,
  },
  tripSheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    gap: hp(1.2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.strokecream,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 8 },
    }),
  },
  tripSheetHandle: {
    width: normalize(40),
    height: normalize(4),
    borderRadius: 2,
    backgroundColor: palette.strokecream,
    alignSelf: 'center',
    marginBottom: hp(0.3),
  },
  tripDestCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: ACCENT_LIGHT,
    borderRadius: normalize(14),
    padding: wp(3.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ACCENT + '30',
  },
  tripDestBody: {
    flex: 1,
    gap: hp(0.2),
  },
  tripDestIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: '#FAFAF8',
    borderRadius: normalize(14),
    padding: wp(3.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
  },
  tripNavIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripNavTitle: {
    textTransform: 'none',
  },
  tripGpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: normalize(10),
  },
  tripGpsBannerWarn: {
    backgroundColor: '#FFF0EB',
  },
});
