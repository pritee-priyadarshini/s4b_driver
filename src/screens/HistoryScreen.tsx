import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { AppBottomSheet } from '../components/AppBottomSheet';
import { HeroHeader } from '../components/HeroHeader';
import { CharityLogoAvatar } from '../components/CharityLogoAvatar';
import { Skeleton } from '../components/Skeleton';
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
const { width: SCREEN_W } = Dimensions.get('window');
/** Half of the stats strip height — used so the strip straddles the hero edge. */
const STATS_OVERLAP = normalize(38);

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
  const org = driver?.profile?.organisation;
  return {
    name: site?.name || org?.name || 'Your charity',
    address: site?.address || '',
    logoUrl: org?.logoUrl ?? null,
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

function statusTone(status: HistoryItem['status']) {
  if (status === 'Delivered') {
    return { color: ACCENT, bg: 'rgba(58,126,82,0.12)' };
  }
  if (status === 'Cancelled') {
    return { color: palette.chilli, bg: 'rgba(255,98,58,0.12)' };
  }
  if (status === 'Picked') {
    return { color: '#B56A12', bg: 'rgba(196,123,26,0.14)' };
  }
  return { color: palette.stone, bg: 'rgba(109,109,114,0.12)' };
}

function formatRating(value: number) {
  if (!value || value <= 0) return '—';
  return `${value}/5`;
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

  const showHistorySkeleton = loadingPast && pastPickups.length === 0;

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
        <CharityLogoAvatar logoUrl={charityHub.logoUrl} name={charityHub.name} />
      </View>
    </HeroHeader>
  );

  const renderStats = () => (
    <View style={styles.statsStrip}>
      <View style={styles.statCell}>
        <View style={styles.statValueRow}>
          <AppText variant="h7" style={styles.statValue}>
            {totalKg}
          </AppText>
          <AppText variant="caption" style={styles.statUnit}>
            kg
          </AppText>
        </View>
        <AppText variant="caption" style={styles.statLabel}>
          Food saved
        </AppText>
      </View>
      <View style={styles.statRule} />
      <View style={styles.statCell}>
        <AppText variant="h7" style={styles.statValue}>
          {completedCount}
        </AppText>
        <AppText variant="caption" style={styles.statLabel}>
          Completed
        </AppText>
      </View>
      <View style={styles.statRule} />
      <View style={styles.statCell}>
        <AppText variant="h7" style={styles.statValue}>
          {todayOrders}
        </AppText>
        <AppText variant="caption" style={styles.statLabel}>
          Today
        </AppText>
      </View>
    </View>
  );

  const renderCard = ({ item }: { item: HistoryItem }) => {
    const qty = itemQty(item.items);
    const tone = statusTone(item.status);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
      >
        <View style={[styles.cardAccent, { backgroundColor: tone.color }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
              <AppText variant="caption" style={{ color: tone.color }}>
                {statusLabel(item.status)}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.orderId}>
              {item.orderId}
            </AppText>
          </View>

          <AppText variant="label" style={styles.restaurantName} numberOfLines={2}>
            {item.restaurant.name}
          </AppText>

          <View style={styles.routeBlock}>
            <View style={styles.routeLine}>
              <View style={[styles.routeDot, styles.routeDotPickup]} />
              <View style={styles.routeStem} />
              <View style={[styles.routeDot, styles.routeDotDrop]} />
            </View>
            <View style={styles.routeCopy}>
              <AppText variant="bodySmall" style={styles.routeText} numberOfLines={1}>
                {item.restaurant.address}
              </AppText>
              <AppText variant="bodySmall" style={styles.routeText} numberOfLines={1}>
                {item.charity.name}
              </AppText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <AppText variant="bodySmall" style={styles.metaText}>
              {item.deliveredDate}
              {item.deliveredTime ? ` · ${item.deliveredTime}` : ''}
            </AppText>
            <Pressable
              hitSlop={8}
              onPress={() => setFoodModal(item)}
              style={styles.kgChip}
            >
              <AppText variant="bodyBold" style={styles.kgChipText}>
                {qty} kg
              </AppText>
              <AppText variant="caption" style={styles.kgChipSub}>
                {item.items.length} items
              </AppText>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <AppText variant="caption" style={styles.ratingText}>
              Charity {formatRating(item.driverRating)}
              {'  ·  '}
              Business {formatRating(item.restaurantRating)}
            </AppText>
            <Ionicons name="chevron-forward" size={normalize(16)} color={palette.stone} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scrollable={false} backgroundColor={palette.creme} transparentTop>
      <FlatList
        data={pastPickups}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListHeaderComponent={
          <>
            {renderHeader()}
            <View style={styles.mainContent}>
              {showHistorySkeleton ? (
                <>
                  <AppText variant="h7" style={styles.sectionTitle}>
                    Recent collections
                  </AppText>
                  <HistorySkeleton />
                </>
              ) : (
                <>
                  {renderStats()}
                  <View style={styles.sectionHead}>
                    <AppText variant="h7" style={styles.sectionTitle}>
                      Recent collections
                    </AppText>
                    <AppText variant="caption" style={styles.sectionCount}>
                      {pastPickups.length}
                    </AppText>
                  </View>
                </>
              )}
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(3) }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: hp(1.2) }} />}
        ListEmptyComponent={
          showHistorySkeleton ? null : (
            <View style={styles.empty}>
              <AppText variant="label" style={styles.emptyTitle}>
                No collections yet
              </AppText>
              <AppText variant="bodySmall" style={styles.emptyCopy}>
                Completed pickups will appear here once you finish a delivery.
              </AppText>
            </View>
          )
        }
      />

      <AppBottomSheet
        visible={!!foodModal}
        onClose={() => setFoodModal(null)}
        title={foodModal?.restaurant.name}
        subtitle={foodModal ? `${foodModal.orderId} · Items collected` : undefined}
      >
        {foodModal?.items.map((food) => (
          <View key={food.name} style={styles.foodRow}>
            <AppText variant="body" style={styles.foodName}>
              {food.name}
            </AppText>
            <AppText variant="bodyBold" style={styles.foodQty}>
              {food.qty} kg
            </AppText>
          </View>
        ))}
        <View style={styles.foodTotal}>
          <AppText variant="bodyBold">Total</AppText>
          <AppText variant="bodyBold">
            {foodModal ? itemQty(foodModal.items) : 0} kg
          </AppText>
        </View>
      </AppBottomSheet>
    </Screen>
  );
}

function HistorySkeleton() {
  return (
    <View style={skeletonStyles.wrap}>
      <Skeleton width="100%" height={normalize(72)} borderRadius={normalize(4)} />
      {[0, 1, 2].map((item) => (
        <View key={item} style={skeletonStyles.card}>
          <Skeleton width={wp(28)} height={normalize(18)} borderRadius={normalize(4)} />
          <Skeleton width="72%" height={normalize(20)} borderRadius={normalize(4)} />
          <Skeleton width="90%" height={normalize(14)} borderRadius={normalize(4)} />
          <Skeleton width="60%" height={normalize(14)} borderRadius={normalize(4)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: SCREEN_W,
    marginLeft: 0,
    height: hp(18),
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: wp(5),
    justifyContent: 'flex-end',
    paddingBottom: STATS_OVERLAP + hp(1.2),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: wp(3),
  },
  heroTextBlock: {
    flex: 1,
    gap: hp(0.25),
    minWidth: 0,
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'none',
    letterSpacing: 0.4,
  },
  heroName: {
    color: palette.white,
    fontSize: normalize(26),
    lineHeight: normalize(32),
    textTransform: 'none',
  },
  heroOrg: {
    color: 'rgba(255,255,255,0.88)',
    textTransform: 'none',
  },
  mainContent: {
    paddingHorizontal: wp(4),
    marginTop: -STATS_OVERLAP,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: palette.white,
    borderRadius: normalize(6),
    borderWidth: 1,
    borderColor: palette.creme2,
    minHeight: STATS_OVERLAP * 2,
    marginBottom: hp(1.8),
    ...Platform.select({
      ios: {
        shadowColor: '#1A1A1B',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(0.35),
    paddingHorizontal: wp(2),
    paddingVertical: hp(1.4),
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: wp(1),
  },
  statValue: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(22),
    lineHeight: normalize(26),
  },
  statUnit: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  statLabel: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  statRule: {
    width: 1,
    backgroundColor: palette.creme2,
    marginVertical: hp(1.2),
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  sectionTitle: {
    textTransform: 'none',
    color: palette.black,
  },
  sectionCount: {
    color: palette.stone,
    textTransform: 'none',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    marginHorizontal: wp(4),
    borderRadius: normalize(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardAccent: {
    width: normalize(3),
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.5),
    gap: hp(0.9),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2),
  },
  statusPill: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.35),
    borderRadius: normalize(3),
  },
  orderId: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  restaurantName: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(17),
    lineHeight: normalize(22),
  },
  routeBlock: {
    flexDirection: 'row',
    gap: wp(2.5),
  },
  routeLine: {
    width: normalize(10),
    alignItems: 'center',
    paddingTop: hp(0.35),
  },
  routeDot: {
    width: normalize(7),
    height: normalize(7),
    borderRadius: normalize(4),
    borderWidth: 1.5,
  },
  routeDotPickup: {
    borderColor: ACCENT,
    backgroundColor: palette.white,
  },
  routeDotDrop: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  routeStem: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    backgroundColor: palette.strokecream,
    marginVertical: hp(0.35),
    minHeight: hp(1.6),
  },
  routeCopy: {
    flex: 1,
    gap: hp(0.85),
    minWidth: 0,
  },
  routeText: {
    color: palette.stone,
    textTransform: 'none',
    lineHeight: normalize(18),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    paddingTop: hp(0.2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.strokecream,
  },
  metaText: {
    flex: 1,
    color: palette.stone,
    textTransform: 'none',
  },
  kgChip: {
    alignItems: 'flex-end',
  },
  kgChipText: {
    color: palette.black,
    textTransform: 'none',
  },
  kgChipSub: {
    color: ACCENT,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingText: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  empty: {
    alignItems: 'center',
    gap: hp(0.8),
    paddingVertical: hp(8),
    paddingHorizontal: wp(10),
    marginHorizontal: wp(4),
  },
  emptyTitle: {
    textTransform: 'none',
    color: palette.black,
  },
  emptyCopy: {
    textAlign: 'center',
    color: palette.stone,
    textTransform: 'none',
    lineHeight: normalize(20),
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.strokecream,
  },
  foodName: {
    flex: 1,
    textTransform: 'none',
  },
  foodQty: {
    color: palette.stone,
    textTransform: 'none',
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

const skeletonStyles = StyleSheet.create({
  wrap: {
    gap: hp(1.2),
    marginBottom: hp(1),
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: normalize(4),
    padding: wp(4),
    gap: hp(1),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
  },
});
