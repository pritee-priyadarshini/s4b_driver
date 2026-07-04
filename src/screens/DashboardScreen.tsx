import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { AppText } from '../components/AppText';
import { AppBottomSheet } from '../components/AppBottomSheet';
import { Screen } from '../components/Screen';
import { HeroHeader } from '../components/HeroHeader';
import { Skeleton } from '../components/Skeleton';
import { OsmMapView } from '../components/OsmMapView';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';
import { useAuth } from '../store/AuthContext';
import { useDriverShiftStore } from '../store/driverShiftStore';
import { usePickupStore } from '../store/pickupStore';
import { AuthDriver } from '../types/auth';
import {
  getDriverSiteId,
  statusToTripPhase,
  type DashboardPickup,
  type DashboardPickupItem,
  type TripPhase,
} from '../utils/pickupMappers';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';
import { showAppError } from '../utils/appAlert';

const ACCENT = palette.kale;
const ACCENT_SOFT = '#D8EBDF';
const ACCENT_LIGHT = '#F2F8F4';
const { width: SCREEN_W } = Dimensions.get('window');

type Coord = { latitude: number; longitude: number };

type CharityHub = {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
};

function restaurantCoord(pickup: DashboardPickup): Coord {
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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function itemQty(items: DashboardPickupItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

function phaseLabel(phase: TripPhase) {
  if (phase === 'assigned') return 'New pickup';
  if (phase === 'to_pickup') return 'Heading to restaurant';
  if (phase === 'to_charity') return 'At restaurant';
  return 'Delivering to charity';
}

function slideLabel(phase: TripPhase) {
  if (phase === 'assigned') return 'Slide to start trip';
  if (phase === 'to_pickup') return 'Slide to confirm pickup';
  if (phase === 'to_charity') return 'Slide to go for delivery';
  return 'Slide to complete delivery';
}

function getCharityHub(driver: AuthDriver | null, pickup?: DashboardPickup | null): CharityHub {
  const site = driver?.profile.sites[0];
  const org = driver?.profile.organisation;

  console.log('[CharityHub] site lat/lng:', site?.latitude, site?.longitude);
  console.log('[CharityHub] pickup charity lat/lng:', pickup?.charityLatitude, pickup?.charityLongitude);
  console.log('[CharityHub] site address:', site?.address);
  console.log('[CharityHub] pickup charity address:', pickup?.charityAddress);
  console.log('[CharityHub] siteAccess address:', driver?.siteAccess?.address);

  return {
    name: pickup?.charityName ?? site?.name ?? org?.name ?? 'Your charity',
    address: pickup?.charityAddress ?? driver?.siteAccess?.address ?? site?.address ?? org?.address ?? '',
    latitude: site?.latitude ?? pickup?.charityLatitude ?? undefined,
    longitude: site?.longitude ?? pickup?.charityLongitude ?? undefined,
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

  const firstName = driver?.firstName || 'Driver';
  const siteId = useMemo(() => getDriverSiteId(driver), [driver]);

  const liveStatus = useDriverShiftStore((s) => s.liveStatus);
  const driverLocation = useDriverShiftStore((s) => s.driverLocation);
  const shiftStartLabel = useDriverShiftStore((s) => s.shiftStartLabel);
  const toggleLive = useDriverShiftStore((s) => s.toggleLive);
  const resumeLiveIfNeeded = useDriverShiftStore((s) => s.resumeLiveIfNeeded);

  const pickups = usePickupStore((s) => s.currentPickups);
  const loadingPickups = usePickupStore((s) => s.loadingCurrent);
  const actionPickupId = usePickupStore((s) => s.actionPickupId);
  const fetchCurrentPickups = usePickupStore((s) => s.fetchCurrentPickups);
  const updatePickupStatus = usePickupStore((s) => s.updatePickupStatus);
  const completePickup = usePickupStore((s) => s.completePickup);
  const removePickupLocally = usePickupStore((s) => s.removePickupLocally);
  const patchPickupLocally = usePickupStore((s) => s.patchPickupLocally);

  const [foodModal, setFoodModal] = useState<DashboardPickup | null>(null);
  const [activeTrip, setActiveTrip] = useState<DashboardPickup | null>(null);
  const baseCharityHub = useMemo(() => getCharityHub(driver, activeTrip), [driver, activeTrip]);
  const [geocodedCoords, setGeocodedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (baseCharityHub.latitude != null && baseCharityHub.longitude != null) {
      setGeocodedCoords(null);
      return;
    }
    const addr = baseCharityHub.address;
    if (!addr) {
      console.log('[CharityHub] No address to geocode');
      return;
    }
    let cancelled = false;
    console.log('[CharityHub] Geocoding address:', addr);
    Location.geocodeAsync(addr)
      .then((results) => {
        if (cancelled) return;
        if (results.length > 0) {
          console.log('[CharityHub] Geocoded:', results[0].latitude, results[0].longitude);
          setGeocodedCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
        } else {
          console.warn('[CharityHub] Geocoding returned no results for:', addr);
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('[CharityHub] Geocoding failed:', err);
      });
    return () => { cancelled = true; };
  }, [baseCharityHub.latitude, baseCharityHub.longitude, baseCharityHub.address]);

  const charityHub: CharityHub = useMemo(() => ({
    ...baseCharityHub,
    latitude: baseCharityHub.latitude ?? geocodedCoords?.latitude,
    longitude: baseCharityHub.longitude ?? geocodedCoords?.longitude,
  }), [baseCharityHub, geocodedCoords]);

  const [tripVisible, setTripVisible] = useState(false);
  const [slideBusy, setSlideBusy] = useState(false);

  const toggleAnim = useRef(new Animated.Value(0)).current;

  const isLive = liveStatus === 'live';

  const loadPickups = useCallback(async () => {
    if (!driver) return;
    try {
      await fetchCurrentPickups(driver, driverLocation);
    } catch {
      // Errors are stored in pickup store; avoid noisy alerts on background refresh.
    }
  }, [driver, driverLocation, fetchCurrentPickups]);

  useFocusEffect(
    useCallback(() => {
      void loadPickups();
    }, [loadPickups]),
  );

  useEffect(() => {
    if (!siteId) return;
    void resumeLiveIfNeeded(siteId);
  }, [siteId, resumeLiveIfNeeded]);

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

    if (!siteId) {
      showAppError(
        'Site not found',
        'Your driver account is missing site access. Contact your charity admin.',
      );
      return;
    }

    const tryingToGoLive = liveStatus === 'offline';
    await toggleLive(siteId);

    if (tryingToGoLive && useDriverShiftStore.getState().liveStatus === 'offline') {
      showAppError(
        'Location required',
        'To go live, allow location access when prompted. For background tracking on Android, choose "While using the app" first — then tap Continue on the next screen to open Settings and select "Allow all the time".',
      );
      return;
    }

    if (tryingToGoLive && useDriverShiftStore.getState().liveStatus === 'live') {
      void loadPickups();
    }
  };

  const sorted = useMemo(
    () =>
      [...pickups].sort((a, b) => {
        const order: TripPhase[] = ['delivering', 'to_charity', 'to_pickup', 'assigned'];
        return order.indexOf(a.phase) - order.indexOf(b.phase);
      }),
    [pickups],
  );

  const updatePickup = (id: string, patch: Partial<DashboardPickup>) => {
    const pickupId = Number(id);
    if (!Number.isNaN(pickupId)) {
      patchPickupLocally(pickupId, patch);
    }
    setActiveTrip((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const openTripMap = (pickup: DashboardPickup) => {
    setActiveTrip(pickup);
    setTripVisible(true);
  };

  const handleSlideComplete = async (pickup: DashboardPickup) => {
    if (liveStatus !== 'live') {
      showAppError('Go live first', 'Turn on Go live before starting a trip.');
      return;
    }

    if (slideBusy || actionPickupId != null) return;

    setSlideBusy(true);
    try {
      if (pickup.phase === 'assigned') {
        const updated = await updatePickupStatus(pickup.pickupId, 'EN_ROUTE');
        const next: DashboardPickup = {
          ...pickup,
          phase: statusToTripPhase(updated.status),
          backendStatus: updated.status,
        };
        updatePickup(pickup.id, next);
        openTripMap(next);
        return;
      }

      if (pickup.phase === 'to_pickup') {
        const updated = await updatePickupStatus(pickup.pickupId, 'ARRIVED');
        const next: DashboardPickup = {
          ...pickup,
          phase: statusToTripPhase(updated.status),
          backendStatus: updated.status,
        };
        updatePickup(pickup.id, next);
        openTripMap(next);
        return;
      }

      if (pickup.phase === 'to_charity') {
        const next: DashboardPickup = {
          ...pickup,
          phase: 'delivering',
        };
        updatePickup(pickup.id, next);
        openTripMap(next);
        return;
      }

      await completePickup(pickup.pickupId);
      setTripVisible(false);
      setActiveTrip(null);
      removePickupLocally(pickup.pickupId);
      void loadPickups();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      showAppError('Pickup update failed', message);
    } finally {
      setSlideBusy(false);
    }
  };

  const tripMapConfig = useMemo(() => {
    if (!activeTrip) return null;

    const restaurant = restaurantCoord(activeTrip);
    const driver = driverLocation;

    console.log('[TripMap] phase:', activeTrip.phase, 'charityHub coords:', charityHub.latitude, charityHub.longitude);

    if (activeTrip.phase === 'to_charity' || activeTrip.phase === 'delivering') {
      if (charityHub.latitude == null || charityHub.longitude == null) {
        console.warn('[TripMap] Charity coordinates not available yet — waiting for geocode');
        return null;
      }
      const charity = { latitude: charityHub.latitude, longitude: charityHub.longitude };
      const origin = driver ?? restaurant;
      const markers = driver ? [driver, charity] : [restaurant, charity];
      return {
        destination: charity,
        routeOrigin: origin,
        destinationLabel: charityHub.name,
        destinationAddress: charityHub.address,
        destinationType: 'charity' as const,
        markers,
        polyline: [origin, charity],
        center: origin,
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

  const renderCard = ({ item }: { item: DashboardPickup }) => {
    const qty = itemQty(item.items);
    const isActive = activeTrip?.id === item.id && tripVisible;
    const isActioning = actionPickupId === item.pickupId || slideBusy;

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

        {item.contact ? (
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
        ) : null}

        <View style={styles.charityNote}>
          <Ionicons name="home-outline" size={normalize(16)} color={palette.stone} />
          <AppText variant="bodySmall" color={palette.stone} style={{ flex: 1 }}>
            Deliver to <AppText variant="bodyBold" style={{ color: palette.black }}>{charityHub.name}</AppText> after pickup
          </AppText>
        </View>

        <SlideToAct
          label={isActioning ? 'Updating…' : slideLabel(item.phase)}
          disabled={!isLive || isActioning}
          onComplete={() => void handleSlideComplete(item)}
        />
      </View>
    );
  };

  const showPickupSkeleton = loadingPickups && pickups.length === 0;

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
                {showPickupSkeleton
                  ? 'Loading pickups…'
                  : `${sorted.length} job${sorted.length !== 1 ? 's' : ''} assigned to you`}
              </AppText>
              {showPickupSkeleton ? <DashboardSkeleton /> : null}
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(3) }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: hp(1.6) }} />}
        ListEmptyComponent={
          showPickupSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={normalize(52)} color={ACCENT_SOFT} />
              <AppText variant="bodyBold" color={palette.stone}>No pickups right now</AppText>
              <AppText variant="bodySmall" color={palette.stone} style={{ textAlign: 'center' }}>
                Go live and we&apos;ll notify you when a restaurant needs a collection.
              </AppText>
            </View>
          )
        }
      />

      <AppBottomSheet
        visible={!!foodModal}
        onClose={() => setFoodModal(null)}
        title={foodModal?.title}
        subtitle="Items to collect from restaurant"
      >
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
      </AppBottomSheet>

      <Modal visible={tripVisible && !!activeTrip} animationType="slide" onRequestClose={() => setTripVisible(false)}>
        {activeTrip && !tripMapConfig ? (
          <View style={[styles.tripRoot, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={ACCENT} />
            <AppText variant="body" style={{ marginTop: hp(2), color: palette.grey }}>Loading charity location…</AppText>
            <Pressable style={{ marginTop: hp(3) }} onPress={() => setTripVisible(false)}>
              <AppText variant="bodyBold" style={{ color: ACCENT }}>Go back</AppText>
            </Pressable>
          </View>
        ) : activeTrip && tripMapConfig ? (
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
                    (activeTrip.phase === 'to_charity' || activeTrip.phase === 'delivering') && styles.tripStepDone,
                  ]}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={normalize(16)}
                    color={
                      activeTrip.phase === 'to_charity' || activeTrip.phase === 'delivering'
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
                      (activeTrip.phase === 'to_charity' || activeTrip.phase === 'delivering') && styles.tripStepLabelDone,
                    ]}
                  >
                    Pickup
                  </AppText>
                </View>
                <View
                  style={[
                    styles.tripStepLine,
                    (activeTrip.phase === 'to_charity' || activeTrip.phase === 'delivering') && styles.tripStepLineDone,
                  ]}
                />
                <View
                  style={[
                    styles.tripStep,
                    activeTrip.phase === 'to_charity' && styles.tripStepActive,
                    activeTrip.phase === 'delivering' && styles.tripStepDone,
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={normalize(16)}
                    color={
                      activeTrip.phase === 'delivering'
                        ? palette.white
                        : activeTrip.phase === 'to_charity'
                          ? ACCENT
                          : palette.stone
                    }
                  />
                  <AppText
                    variant="caption"
                    style={[
                      styles.tripStepLabel,
                      activeTrip.phase === 'to_charity' && styles.tripStepLabelActive,
                      activeTrip.phase === 'delivering' && styles.tripStepLabelDone,
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

function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.wrap}>
      <View style={skeletonStyles.liveCard}>
        <Skeleton width={normalize(44)} height={normalize(44)} borderRadius={normalize(22)} />
        <View style={skeletonStyles.liveText}>
          <Skeleton width="55%" height={normalize(16)} borderRadius={normalize(6)} />
          <Skeleton width="80%" height={normalize(12)} borderRadius={normalize(4)} />
        </View>
        <Skeleton width={normalize(54)} height={normalize(30)} borderRadius={normalize(16)} />
      </View>

      {[0, 1].map((item) => (
        <View key={item} style={skeletonStyles.pickupCard}>
          <View style={skeletonStyles.cardTopRow}>
            <Skeleton width={wp(28)} height={normalize(24)} borderRadius={normalize(8)} />
            <Skeleton width={wp(16)} height={normalize(14)} borderRadius={normalize(4)} />
          </View>
          <Skeleton width="72%" height={normalize(20)} borderRadius={normalize(6)} />
          <Skeleton width="90%" height={normalize(14)} borderRadius={normalize(4)} />
          <View style={skeletonStyles.infoRow}>
            <Skeleton width="48%" height={normalize(64)} borderRadius={normalize(12)} />
            <Skeleton width="48%" height={normalize(64)} borderRadius={normalize(12)} />
          </View>
          <Skeleton width="100%" height={normalize(52)} borderRadius={normalize(14)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: SCREEN_W,
    marginLeft: 0,
    height: hp(21),
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
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: normalize(20),
    maxWidth: '100%',
    marginBottom: -hp(0.5),
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

const skeletonStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: wp(4),
    gap: hp(1.6),
  },
  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
  },
  liveText: {
    flex: 1,
    gap: hp(0.6),
  },
  pickupCard: {
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4),
    gap: hp(1.2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(2.5),
  },
});
