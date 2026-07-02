import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { HeroHeader } from '../components/HeroHeader';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';
import { useAuth } from '../store/AuthContext';
import { usePickupStore } from '../store/pickupStore';
import { AuthDriver } from '../types/auth';
import { HistoryOrder } from '../types/history';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';

import {
  MainTabParamList,
  RootStackParamList,
} from '../navigation/types';

const ACCENT = palette.kale;
const ACCENT_SOFT = '#D8EBDF';
const ACCENT_LIGHT = '#F2F8F4';
const { width: SCREEN_W } = Dimensions.get('window');

type Props =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'History'>,
    NativeStackScreenProps<RootStackParamList>
  >;

type HistoryItem = HistoryOrder;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getCharityHub(driver: AuthDriver | null) {
  const site = driver?.profile?.sites?.[0];
  return {
    name: site?.name || driver?.profile?.organisation?.name || 'Your charity',
    address: site?.address || '',
  };
}

function itemQty(items: { qty: number }[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

function statusLabel(status: HistoryItem['status']) {
  if (status === 'Delivered') return 'Completed';
  if (status === 'Picked') return 'In transit';
  if (status === 'Cancelled') return 'Cancelled';
  return 'Assigned';
}

function statusColor(status: HistoryItem['status']) {
  if (status === 'Delivered') return ACCENT;
  if (status === 'Cancelled') return palette.chilli;
  if (status === 'Picked') return '#C47B1A';
  return palette.stone;
}

export function HistoryScreen({ navigation }: Props) {
  useTransparentStatusBar('light');
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const pastPickups = usePickupStore((s) => s.pastPickups);
  const loadingPast = usePickupStore((s) => s.loadingPast);
  const fetchPastPickups = usePickupStore((s) => s.fetchPastPickups);

  const charityHub = useMemo(() => getCharityHub(driver), [driver]);
  const firstName = driver?.firstName || 'Driver';
  const [foodModal, setFoodModal] = useState<HistoryItem | null>(null);

  const loadHistory = useCallback(async () => {
    if (!driver) return;
    try {
      await fetchPastPickups(driver);
    } catch {
      // Keep existing list on refresh failure.
    }
  }, [driver, fetchPastPickups]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [],
  );

  const todayOrders = useMemo(
    () => pastPickups.filter((item) => item.assignedDate === todayLabel).length,
    [pastPickups, todayLabel],
  );

  const totalKg = useMemo(
    () => pastPickups.reduce((sum, item) => sum + itemQty(item.items), 0),
    [pastPickups],
  );

  const completedCount = useMemo(
    () => pastPickups.filter((i) => i.status === 'Delivered').length,
    [pastPickups],
  );

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
      <View style={[styles.locationPill, styles.locationPillHistory]}>
        <Ionicons name="time-outline" size={normalize(14)} color={palette.white} />
        <AppText variant="caption" style={styles.locationPillText}>
          Collection history · {pastPickups.length} trips
        </AppText>
      </View>
    </HeroHeader>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: ACCENT_SOFT }]}>
            <Ionicons name="basket-outline" size={normalize(20)} color={ACCENT} />
          </View>
          <AppText variant="h7" style={styles.statValue}>{totalKg} kg</AppText>
          <AppText variant="caption" color={palette.stone} style={styles.statLabel}>
            Food saved
          </AppText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: ACCENT_SOFT }]}>
            <Ionicons name="checkmark-circle-outline" size={normalize(20)} color={ACCENT} />
          </View>
          <AppText variant="h7" style={styles.statValue}>{completedCount}</AppText>
          <AppText variant="caption" color={palette.stone} style={styles.statLabel}>
            Completed
          </AppText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: ACCENT_SOFT }]}>
            <Ionicons name="today-outline" size={normalize(20)} color={ACCENT} />
          </View>
          <AppText variant="h7" style={styles.statValue}>{todayOrders}</AppText>
          <AppText variant="caption" color={palette.stone} style={styles.statLabel}>
            Today
          </AppText>
        </View>
      </View>
    </View>
  );

  const renderCard = ({ item }: { item: HistoryItem }) => {
    const qty = itemQty(item.items);
    const accent = statusColor(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: ACCENT_SOFT }]}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <AppText variant="caption" style={{ color: accent }}>
              {statusLabel(item.status)}
            </AppText>
          </View>
          <AppText variant="bodyBold" style={styles.orderIdText}>
            {item.orderId}
          </AppText>
        </View>

        <AppText variant="h6" style={styles.restaurantTitle}>
          {item.restaurant.name}
        </AppText>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={normalize(18)} color={ACCENT} />
          <AppText variant="bodySmall" color={palette.stone} style={styles.addressText}>
            {item.restaurant.address}
          </AppText>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={normalize(20)} color={ACCENT} />
            <View style={styles.infoBoxText}>
              <AppText variant="caption" color={palette.stone}>Delivered</AppText>
              <AppText variant="bodyBold" style={styles.infoValue} numberOfLines={1}>
                {item.deliveredDate}
              </AppText>
              <AppText variant="bodySmall" color={palette.stone}>{item.deliveredTime}</AppText>
            </View>
          </View>
          <Pressable style={styles.infoBox} onPress={() => setFoodModal(item)}>
            <Ionicons name="basket-outline" size={normalize(20)} color={ACCENT} />
            <View style={styles.infoBoxText}>
              <AppText variant="caption" color={palette.stone}>Food collected</AppText>
              <AppText variant="bodyBold" style={styles.infoValue}>{qty} kg</AppText>
              <AppText variant="bodySmall" style={{ color: ACCENT }}>
                {item.items.length} items · View
              </AppText>
            </View>
          </Pressable>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={normalize(14)} color="#E8A317" />
            <AppText variant="bodySmall" color={palette.stone}>
              You: <AppText variant="bodyBold">{item.driverRating}/5</AppText>
            </AppText>
          </View>
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={normalize(14)} color="#E8A317" />
            <AppText variant="bodySmall" color={palette.stone}>
              Restaurant: <AppText variant="bodyBold">{item.restaurantRating}/5</AppText>
            </AppText>
          </View>
        </View>

        <View style={styles.charityNote}>
          <Ionicons name="home-outline" size={normalize(16)} color={palette.stone} />
          <AppText variant="bodySmall" color={palette.stone} style={{ flex: 1 }}>
            Delivered to{' '}
            <AppText variant="bodyBold" style={{ color: palette.black }}>
              {item.charity.name}
            </AppText>
          </AppText>
        </View>

        <Pressable
          style={styles.detailsBtn}
          onPress={() => navigation.navigate('OrderDetails', { order: item })}
        >
          <Ionicons name="document-text-outline" size={normalize(18)} color={ACCENT} />
          <AppText variant="bodyBold" style={{ color: ACCENT }}>View full details</AppText>
          <Ionicons name="chevron-forward" size={normalize(18)} color={ACCENT} />
        </Pressable>
      </View>
    );
  };

  return (
    <Screen scrollable={false} backgroundColor={palette.background} transparentTop>
      <FlatList
        data={pastPickups}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListHeaderComponent={
          <>
            {renderHeader()}
            <View style={styles.mainContent}>
              {renderStatsCard()}
              <AppText variant="h7" style={styles.sectionTitle}>
                Recent collections
              </AppText>
              <AppText variant="bodySmall" color={palette.stone} style={styles.sectionSub}>
                {loadingPast
                  ? 'Loading history…'
                  : `${pastPickups.length} trip${pastPickups.length !== 1 ? 's' : ''} on record`}
              </AppText>
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(3) }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: hp(1.6) }} />}
        ListEmptyComponent={
          loadingPast ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={ACCENT} />
              <AppText variant="bodySmall" color={palette.stone}>
                Loading collection history…
              </AppText>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={normalize(52)} color={ACCENT_SOFT} />
              <AppText variant="bodyBold" color={palette.stone}>No collections yet</AppText>
              <AppText variant="bodySmall" color={palette.stone} style={{ textAlign: 'center' }}>
                Completed pickups will show up here after you deliver.
              </AppText>
            </View>
          )
        }
      />

      <Modal visible={!!foodModal} transparent animationType="slide" onRequestClose={() => setFoodModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFoodModal(null)}>
          <Pressable style={styles.foodSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <AppText variant="h6" style={styles.sheetTitle}>{foodModal?.restaurant.name}</AppText>
            <AppText variant="bodySmall" color={palette.stone} style={{ marginBottom: hp(1.5) }}>
              {foodModal?.orderId} · Items collected
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: SCREEN_W,
    marginLeft: 0,
    height: hp(20),
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
  locationPillHistory: {
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  locationPillText: {
    color: palette.white,
    flexShrink: 1,
    textTransform: 'none',
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
  statsCard: {
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4),
    marginBottom: hp(1.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ACCENT + '30',
    ...Platform.select({
      ios: { shadowColor: palette.black, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: hp(0.4),
  },
  statIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    textTransform: 'none',
    fontSize: normalize(18),
    color: palette.black,
  },
  statLabel: {
    textTransform: 'none',
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: hp(5),
    backgroundColor: palette.strokecream,
  },
  sectionTitle: {
    textTransform: 'none',
    marginTop: hp(1),
    marginBottom: hp(0.2),
  },
  sectionSub: {
    marginBottom: hp(1),
    textTransform: 'none',
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4),
    marginHorizontal: wp(4),
    gap: hp(1.2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
    ...Platform.select({
      ios: { shadowColor: palette.black, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
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
    paddingVertical: hp(0.45),
    borderRadius: normalize(8),
  },
  statusDot: {
    width: normalize(7),
    height: normalize(7),
    borderRadius: normalize(4),
  },
  orderIdText: {
    textTransform: 'none',
    color: palette.stone,
    fontSize: normalize(13),
  },
  restaurantTitle: {
    textTransform: 'none',
    fontSize: normalize(20),
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
    alignItems: 'flex-start',
    gap: wp(2),
    backgroundColor: ACCENT_LIGHT,
    borderRadius: normalize(12),
    padding: wp(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ACCENT + '25',
  },
  infoBoxText: {
    flex: 1,
    gap: hp(0.15),
    minWidth: 0,
  },
  infoValue: {
    textTransform: 'none',
    fontSize: normalize(15),
  },
  ratingRow: {
    flexDirection: 'row',
    gap: wp(3),
    flexWrap: 'wrap',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  charityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
    paddingTop: hp(0.2),
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1.2),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: ACCENT + '60',
    backgroundColor: palette.white,
    marginTop: hp(0.3),
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
});
