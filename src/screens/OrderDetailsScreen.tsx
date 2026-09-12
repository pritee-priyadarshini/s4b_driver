import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
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
import { formatKgLabel } from '../utils/formatKg';
import { RootStackParamList } from '../navigation/types';
import { OrderStatus } from '../types/history';

const ACCENT = palette.kale;
const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

function statusLabel(status: OrderStatus) {
  if (status === 'Delivered') return 'Completed';
  if (status === 'Picked') return 'In transit';
  if (status === 'Cancelled') return 'Cancelled';
  return 'Assigned';
}

function statusTone(status: OrderStatus) {
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
  if (!value || value <= 0) return null;
  return value;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={normalize(15)}
          color={star <= rating ? '#C9962A' : palette.strokecream}
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

  const tone = statusTone(order.status);
  const charityRating = formatRating(order.driverRating);
  const businessRating = formatRating(order.restaurantRating);

  return (
    <Screen scrollable={false} backgroundColor={palette.creme} transparentTop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(3) }}
      >
        <HeroHeader
          source={require('../../assets/placeholder/kale-header.png')}
          height={hp(22)}
          style={styles.heroWrap}
          contentStyle={styles.heroContent}
        >
          <StatusBar style="light" translucent backgroundColor="transparent" />

          <View style={styles.heroTopBar}>
            <Pressable
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={normalize(20)} color={palette.white} />
            </Pressable>
            <AppText variant="caption" style={styles.heroTopLabel}>
              Trip details
            </AppText>
            <View style={styles.heroTopSpacer} />
          </View>

          <View style={styles.heroBody}>
            <AppText variant="h6" style={styles.heroTitle} numberOfLines={2}>
              {order.restaurant.name}
            </AppText>
            <AppText variant="bodySmall" style={styles.heroRoute} numberOfLines={1}>
              Delivered to {order.charity.name}
            </AppText>
            <View style={styles.heroMetaRow}>
              <AppText variant="caption" style={styles.heroMeta}>
                {order.orderId}
              </AppText>
              <View style={styles.heroMetaDot} />
              <AppText variant="caption" style={styles.heroMeta}>
                {totalQty} kg · {order.items.length} items
              </AppText>
            </View>
            <View style={styles.heroStatus}>
              <View style={[styles.heroStatusDot, { backgroundColor: tone.color }]} />
              <AppText variant="caption" style={styles.heroStatusText}>
                {statusLabel(order.status)}
              </AppText>
            </View>
          </View>
        </HeroHeader>

        <View style={styles.mainContent}>
          <View style={styles.panel}>
            <AppText variant="caption" style={styles.panelLabel}>
              Timeline
            </AppText>

            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, styles.timelineDotMuted]} />
                  <View style={styles.timelineStem} />
                </View>
                <View style={styles.timelineCopy}>
                  <AppText variant="caption" style={styles.timelineRole}>
                    Assigned
                  </AppText>
                  <AppText variant="bodyBold" style={styles.timelinePrimary}>
                    {order.assignedDate}
                  </AppText>
                  <AppText variant="bodySmall" style={styles.timelineSecondary}>
                    {order.assignedTime}
                  </AppText>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, styles.timelineDotActive]} />
                </View>
                <View style={styles.timelineCopy}>
                  <AppText variant="caption" style={styles.timelineRole}>
                    Delivered
                  </AppText>
                  <AppText variant="bodyBold" style={styles.timelinePrimary}>
                    {order.deliveredDate}
                  </AppText>
                  <AppText variant="bodySmall" style={styles.timelineSecondary}>
                    {order.deliveredTime}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <AppText variant="caption" style={styles.panelLabel}>
              Route
            </AppText>

            <View style={styles.routeBlock}>
              <View style={styles.routeRail}>
                <View style={[styles.routeDot, styles.routeDotPickup]} />
                <View style={styles.routeStem} />
                <View style={[styles.routeDot, styles.routeDotDrop]} />
              </View>

              <View style={styles.routeCopy}>
                <View style={styles.routeStop}>
                  <AppText variant="caption" style={styles.routeRole}>
                    Pickup
                  </AppText>
                  <AppText variant="label" style={styles.routeName}>
                    {order.restaurant.name}
                  </AppText>
                  <AppText variant="bodySmall" style={styles.routeAddress}>
                    {order.restaurant.address}
                  </AppText>
                </View>

                <View style={styles.routeStop}>
                  <AppText variant="caption" style={styles.routeRole}>
                    Delivery
                  </AppText>
                  <AppText variant="label" style={styles.routeName}>
                    {order.charity.name}
                  </AppText>
                  <AppText variant="bodySmall" style={styles.routeAddress}>
                    {order.charity.address}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.itemsHead}>
              <AppText variant="caption" style={styles.panelLabel}>
                Food collected
              </AppText>
              <AppText variant="bodySmall" style={styles.itemsTotal}>
                {formatKgLabel(totalQty)}
              </AppText>
            </View>

            {order.items.map((item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={[
                  styles.foodRow,
                  index === order.items.length - 1 && styles.foodRowLast,
                ]}
              >
                <AppText variant="body" style={styles.foodName} numberOfLines={2}>
                  {item.name}
                </AppText>
                <AppText variant="bodySmall" style={styles.foodQty}>
                  {formatKgLabel(item.qty)}
                </AppText>
              </View>
            ))}
          </View>

          <View style={styles.panel}>
            <AppText variant="caption" style={styles.panelLabel}>
              Feedback
            </AppText>

            <View style={styles.feedbackRow}>
              <View style={styles.feedbackCopy}>
                <AppText variant="bodyBold" style={styles.feedbackTitle}>
                  Rated by charity
                </AppText>
                {charityRating != null ? (
                  <StarRating rating={charityRating} />
                ) : (
                  <AppText variant="bodySmall" style={styles.feedbackEmpty}>
                    Not rated yet
                  </AppText>
                )}
              </View>
              <AppText variant="h7" style={styles.feedbackScore}>
                {charityRating != null ? `${charityRating}/5` : '—'}
              </AppText>
            </View>

            <View style={styles.feedbackDivider} />

            <View style={styles.feedbackRow}>
              <View style={styles.feedbackCopy}>
                <AppText variant="bodyBold" style={styles.feedbackTitle}>
                  Rated by food business
                </AppText>
                {businessRating != null ? (
                  <StarRating rating={businessRating} />
                ) : (
                  <AppText variant="bodySmall" style={styles.feedbackEmpty}>
                    Not rated yet
                  </AppText>
                )}
              </View>
              <AppText variant="h7" style={styles.feedbackScore}>
                {businessRating != null ? `${businessRating}/5` : '—'}
              </AppText>
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
    height: hp(24),
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: wp(5),
    justifyContent: 'space-between',
    paddingBottom: hp(3.5),
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.6),
  },
  backBtn: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopLabel: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'none',
    letterSpacing: 0.4,
  },
  heroTopSpacer: {
    width: normalize(36),
  },
  heroBody: {
    gap: hp(0.45),
  },
  heroTitle: {
    color: palette.white,
    fontSize: normalize(22),
    lineHeight: normalize(28),
    textTransform: 'none',
  },
  heroRoute: {
    color: 'rgba(255,255,255,0.88)',
    textTransform: 'none',
    lineHeight: normalize(19),
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp(1.5),
    marginTop: hp(0.15),
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  heroMetaDot: {
    width: normalize(3),
    height: normalize(3),
    borderRadius: normalize(2),
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.45),
    borderRadius: normalize(3),
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginTop: hp(0.35),
  },
  heroStatusDot: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
  },
  heroStatusText: {
    color: palette.black,
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  mainContent: {
    paddingHorizontal: wp(4),
    marginTop: -hp(1.6),
    gap: hp(1.4),
  },
  panel: {
    backgroundColor: palette.white,
    borderRadius: normalize(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.strokecream,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.6),
    paddingBottom: hp(1.8),
  },
  panelLabel: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.5,
    marginBottom: hp(1.2),
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: wp(3),
  },
  timelineRail: {
    width: normalize(12),
    alignItems: 'center',
  },
  timelineDot: {
    width: normalize(9),
    height: normalize(9),
    borderRadius: normalize(5),
    marginTop: hp(0.2),
  },
  timelineDotMuted: {
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.stone,
  },
  timelineDotActive: {
    backgroundColor: ACCENT,
    borderWidth: 0,
  },
  timelineStem: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    backgroundColor: palette.strokecream,
    marginVertical: hp(0.4),
    minHeight: hp(2.8),
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: hp(1.6),
    gap: hp(0.2),
  },
  timelineRole: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  timelinePrimary: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(16),
  },
  timelineSecondary: {
    color: palette.stone,
    textTransform: 'none',
  },
  routeBlock: {
    flexDirection: 'row',
    gap: wp(3),
  },
  routeRail: {
    width: normalize(12),
    alignItems: 'center',
    paddingTop: hp(0.55),
  },
  routeDot: {
    width: normalize(9),
    height: normalize(9),
    borderRadius: normalize(5),
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
    marginVertical: hp(0.45),
    minHeight: hp(4),
  },
  routeCopy: {
    flex: 1,
    gap: hp(2),
    minWidth: 0,
  },
  routeStop: {
    gap: hp(0.25),
  },
  routeRole: {
    color: palette.stone,
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  routeName: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(16),
    lineHeight: normalize(21),
  },
  routeAddress: {
    color: palette.stone,
    textTransform: 'none',
    lineHeight: normalize(19),
  },
  itemsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.4),
  },
  itemsTotal: {
    textTransform: 'none',
    color: ACCENT,
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(15),
    lineHeight: normalize(22),
    flexShrink: 0,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.strokecream,
    gap: wp(3),
  },
  foodRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  foodName: {
    flex: 1,
    flexShrink: 1,
    textTransform: 'none',
    paddingRight: 0,
  },
  foodQty: {
    color: palette.black,
    textTransform: 'none',
    fontFamily: 'Saveful-SemiBold',
    fontSize: normalize(15),
    lineHeight: normalize(22),
    flexShrink: 0,
    textAlign: 'right',
    minWidth: wp(18),
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
  },
  feedbackCopy: {
    flex: 1,
    gap: hp(0.45),
  },
  feedbackTitle: {
    textTransform: 'none',
    color: palette.black,
  },
  feedbackEmpty: {
    color: palette.stone,
    textTransform: 'none',
  },
  feedbackScore: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(20),
  },
  feedbackDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.strokecream,
    marginVertical: hp(1.4),
  },
  starRow: {
    flexDirection: 'row',
    gap: wp(0.6),
  },
});
