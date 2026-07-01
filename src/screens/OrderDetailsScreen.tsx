import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { HeroHeader } from '../components/HeroHeader';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';
import { RootStackParamList } from '../navigation/types';
import { OrderStatus } from '../types/history';

const ACCENT = palette.kale;
const ACCENT_SOFT = '#D8EBDF';
const ACCENT_LIGHT = '#F2F8F4';
const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

function statusLabel(status: OrderStatus) {
  if (status === 'Delivered') return 'Completed';
  if (status === 'Picked') return 'In transit';
  if (status === 'Cancelled') return 'Cancelled';
  return 'Assigned';
}

function statusColor(status: OrderStatus) {
  if (status === 'Delivered') return ACCENT;
  if (status === 'Picked') return '#C47B1A';
  if (status === 'Cancelled') return palette.chilli;
  return palette.stone;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={normalize(18)}
          color="#E8A317"
        />
      ))}
    </View>
  );
}

export function OrderDetailsScreen({ route, navigation }: Props) {
  useTransparentStatusBar('light');
  const insets = useSafeAreaInsets();
  const { order } = route.params;

  const totalQty = useMemo(
    () => order.items.reduce((sum, item) => sum + item.qty, 0),
    [order.items],
  );

  const accent = statusColor(order.status);

  return (
    <Screen scrollable={false} backgroundColor={palette.background} transparentTop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(3) }}
      >
        <HeroHeader
          source={require('../../assets/placeholder/kale-header.png')}
          height={hp(20)}
          style={styles.heroWrap}
          contentStyle={styles.heroContent}
        >
          <StatusBar style="light" translucent backgroundColor="transparent" />

          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={normalize(22)} color={palette.white} />
          </Pressable>

          <View style={styles.heroBody}>
            <AppText variant="caption" style={styles.heroEyebrow}>
              Order details
            </AppText>
            <AppText variant="h6" style={styles.heroTitle}>
              {order.orderId}
            </AppText>
            <View style={[styles.heroPill, { backgroundColor: 'rgba(0,0,0,0.28)' }]}>
              <View style={[styles.statusDot, { backgroundColor: accent }]} />
              <AppText variant="caption" style={styles.heroPillText}>
                {statusLabel(order.status)}
              </AppText>
            </View>
          </View>
        </HeroHeader>

        <View style={styles.mainContent}>
          <View style={styles.card}>
            <AppText variant="h7" style={styles.sectionTitle}>
              Trip timeline
            </AppText>
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Ionicons name="calendar-outline" size={normalize(20)} color={ACCENT} />
                <View style={styles.infoBoxText}>
                  <AppText variant="caption" color={palette.stone}>Assigned</AppText>
                  <AppText variant="bodyBold" style={styles.infoValue} numberOfLines={1}>
                    {order.assignedDate}
                  </AppText>
                  <AppText variant="bodySmall" color={palette.stone}>{order.assignedTime}</AppText>
                </View>
              </View>
              <View style={styles.infoBox}>
                <Ionicons name="checkmark-circle-outline" size={normalize(20)} color={ACCENT} />
                <View style={styles.infoBoxText}>
                  <AppText variant="caption" color={palette.stone}>Delivered</AppText>
                  <AppText variant="bodyBold" style={styles.infoValue} numberOfLines={1}>
                    {order.deliveredDate}
                  </AppText>
                  <AppText variant="bodySmall" color={palette.stone}>{order.deliveredTime}</AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.statusBadge, { backgroundColor: ACCENT_SOFT }]}>
                <Ionicons name="restaurant-outline" size={normalize(14)} color={ACCENT} />
                <AppText variant="caption" style={{ color: ACCENT }}>Pickup</AppText>
              </View>
            </View>

            <AppText variant="h6" style={styles.restaurantTitle}>
              {order.restaurant.name}
            </AppText>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={normalize(18)} color={ACCENT} />
              <AppText variant="bodySmall" color={palette.stone} style={styles.addressText}>
                {order.restaurant.address}
              </AppText>
            </View>

            <View style={styles.itemsSection}>
              <AppText variant="bodyBold" style={styles.itemsTitle}>
                Food collected
              </AppText>
              <AppText variant="bodySmall" color={palette.stone} style={styles.itemsSub}>
                {order.items.length} items · {totalQty} kg total
              </AppText>

              {order.items.map((item) => (
                <View key={item.name} style={styles.foodRow}>
                  <AppText variant="body" style={{ flex: 1 }}>{item.name}</AppText>
                  <AppText variant="bodyBold" color={palette.stone}>{item.qty} kg</AppText>
                </View>
              ))}

              <View style={styles.foodTotal}>
                <AppText variant="bodyBold">Total</AppText>
                <AppText variant="bodyBold" style={{ color: ACCENT }}>{totalQty} kg</AppText>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.statusBadge, { backgroundColor: ACCENT_SOFT }]}>
                <Ionicons name="home-outline" size={normalize(14)} color={ACCENT} />
                <AppText variant="caption" style={{ color: ACCENT }}>Delivery</AppText>
              </View>
            </View>

            <AppText variant="h6" style={styles.restaurantTitle}>
              {order.charity.name}
            </AppText>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={normalize(18)} color={ACCENT} />
              <AppText variant="bodySmall" color={palette.stone} style={styles.addressText}>
                {order.charity.address}
              </AppText>
            </View>

            <View style={styles.charityNote}>
              <Ionicons name="heart-outline" size={normalize(16)} color={ACCENT} />
              <AppText variant="bodySmall" color={palette.stone} style={{ flex: 1 }}>
                This collection was delivered to the charity hub above.
              </AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="h7" style={styles.sectionTitle}>
              Collection feedback
            </AppText>

            <View style={styles.feedbackBox}>
              <View style={styles.feedbackRow}>
                <View style={[styles.feedbackIcon, { backgroundColor: ACCENT_SOFT }]}>
                  <Ionicons name="person-outline" size={normalize(18)} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color={palette.stone}>Your experience</AppText>
                  <StarRating rating={order.driverRating} />
                </View>
                <AppText variant="bodyBold" style={styles.ratingScore}>
                  {order.driverRating}/5
                </AppText>
              </View>

              <View style={styles.feedbackDivider} />

              <View style={styles.feedbackRow}>
                <View style={[styles.feedbackIcon, { backgroundColor: ACCENT_SOFT }]}>
                  <Ionicons name="restaurant-outline" size={normalize(18)} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color={palette.stone}>Restaurant experience</AppText>
                  <StarRating rating={order.restaurantRating} />
                </View>
                <AppText variant="bodyBold" style={styles.ratingScore}>
                  {order.restaurantRating}/5
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  backBtn: {
    position: 'absolute',
    left: wp(5),
    top: hp(5),
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroBody: {
    gap: hp(0.6),
    paddingTop: hp(4),
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: palette.white,
    fontSize: normalize(26),
    lineHeight: normalize(34),
    textTransform: 'none',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.5),
    paddingVertical: hp(0.65),
    paddingHorizontal: wp(3),
    borderRadius: normalize(20),
  },
  heroPillText: {
    color: palette.white,
    textTransform: 'none',
  },
  statusDot: {
    width: normalize(7),
    height: normalize(7),
    borderRadius: normalize(4),
  },
  mainContent: {
    paddingHorizontal: wp(4),
    marginTop: -hp(1),
    gap: hp(1.6),
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: normalize(16),
    padding: wp(4),
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
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.45),
    borderRadius: normalize(8),
  },
  sectionTitle: {
    textTransform: 'none',
    marginBottom: hp(0.2),
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
  itemsSection: {
    backgroundColor: ACCENT_LIGHT,
    borderRadius: normalize(12),
    padding: wp(3.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ACCENT + '25',
    gap: hp(0.4),
  },
  itemsTitle: {
    textTransform: 'none',
  },
  itemsSub: {
    textTransform: 'none',
    marginBottom: hp(0.6),
  },
  foodRow: {
    flexDirection: 'row',
    paddingVertical: hp(0.9),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.strokecream,
  },
  foodTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.8),
    paddingTop: hp(1),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.strokecream,
  },
  charityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
    backgroundColor: ACCENT_LIGHT,
    borderRadius: normalize(10),
    padding: wp(3),
    marginTop: hp(0.3),
  },
  feedbackBox: {
    backgroundColor: ACCENT_LIGHT,
    borderRadius: normalize(12),
    padding: wp(3.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ACCENT + '25',
    gap: hp(1.2),
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  feedbackIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.strokecream,
  },
  starRow: {
    flexDirection: 'row',
    gap: wp(0.5),
    marginTop: hp(0.4),
  },
  ratingScore: {
    textTransform: 'none',
    color: palette.black,
  },
});
