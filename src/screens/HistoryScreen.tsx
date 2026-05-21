import React, { useMemo } from 'react';

import {
  View,
  StyleSheet,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Dimensions
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { NativeStackScreenProps, } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';

import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';

import {
  MainTabParamList,
  RootStackParamList,
} from '../navigation/types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const normalize = (size: number) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

type Props =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'History'>,
    NativeStackScreenProps<RootStackParamList>
  >;

type HistoryItem = {
  id: string;
  orderId: string;
  status:
  | 'Assigned'
  | 'Picked'
  | 'Delivered';
  restaurant: {
    name: string;
    address: string;
  };
  charity: {
    name: string;
    address: string;
  };
  assignedDate: string;
  assignedTime: string;
  deliveredDate: string;
  deliveredTime: string;
  driverRating: number;
  restaurantRating: number;
  items: {
    name: string;
    qty: number;
  }[];
};

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    orderId: '#S4B-1024',

    status: 'Delivered',

    restaurant: {
      name: 'Pizza Hut',
      address: 'MG Road, Bangalore',
    },

    charity: {
      name: 'Hope Foundation',
      address: 'Indiranagar, Bangalore',
    },

    assignedDate: '12 Apr 2026',
    assignedTime: '02:00 PM',

    deliveredDate: '12 Apr 2026',
    deliveredTime: '04:30 PM',

    driverRating: 4,
    restaurantRating: 5,

    items: [
      {
        name: 'Bread',
        qty: 5,
      },
      {
        name: 'Rice',
        qty: 10,
      },
    ],
  },

  {
    id: '2',
    orderId: '#S4B-1041',

    status: 'Picked',

    restaurant: {
      name: 'Red Dragon',
      address: 'Marathahalli',
    },

    charity: {
      name: 'Smile Trust',
      address: 'Whitefield',
    },

    assignedDate: '11 Apr 2026',
    assignedTime: '01:30 PM',

    deliveredDate: '11 Apr 2026',
    deliveredTime: '05:00 PM',

    driverRating: 5,
    restaurantRating: 4,

    items: [
      {
        name: 'Cooked Food',
        qty: 15,
      },
    ],
  },
];

export function HistoryScreen({
  navigation,
}: Props) {

  const todayOrders = useMemo(() => {
    return mockHistory.filter(
      (item) =>
        item.assignedDate ===
        '12 Apr 2026'
    ).length;
  }, []);

  const statusColor = (
    status: HistoryItem['status']
  ) => {
    switch (status) {
      case 'Assigned':
        return palette.orange;
      case 'Picked':
        return palette.primary;
      case 'Delivered':
        return palette.success;
      default:
        return palette.stone;
    }
  };

  const renderItem = ({
    item,
  }: {
    item: HistoryItem;
  }) => {

    const totalQty =
      item.items.reduce(
        (sum, current) =>
          sum + current.qty,
        0
      );

    return (
      <View style={styles.orderCard}>
        {/* TOP */}
        <View style={styles.orderTop}>
          <View>
            <AppText variant="caption" style={styles.orderLabel} >
              ORDER ID
            </AppText>

            <AppText variant="h6">
              {item.orderId}
            </AppText>

          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  statusColor(item.status),
              },
            ]}
          >
            <AppText
              variant="label"
              style={{
                color:
                  palette.white,
              }}
            >
              {item.status}
            </AppText>
          </View>

        </View>

        {/* RESTAURANT */}
        <View style={styles.restaurantRow}>
          <View style={styles.restaurantIcon}>
            <Ionicons
              name="restaurant-outline"
              size={normalize(20)}
              color={palette.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold"  >
              {item.restaurant.name}
            </AppText>

            <AppText variant="bodySmall" style={styles.address}  >
              📍{' '} {item.restaurant.address}
            </AppText>
          </View>
        </View>

        {/* METRICS */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <AppText variant="caption" style={styles.metricLabel}  >
              ITEMS
            </AppText>

            <AppText variant="bodyBold">
              {item.items.length}
            </AppText>
          </View>

          <View style={styles.metricCard}>
            <AppText variant="caption" style={styles.metricLabel}  >
              QUANTITY
            </AppText>

            <AppText variant="bodyBold">
              {totalQty} kg
            </AppText>
          </View>

          <View style={styles.metricCard}>
            <AppText variant="caption" style={styles.metricLabel} >
              DELIVERY
            </AppText>

            <AppText variant="bodyBold">
              Done
            </AppText>
          </View>
        </View>

        {/* BOTTOM */}

        <View style={styles.bottomRow}>
          <View>
            <AppText variant="caption" style={styles.dateLabel} >
              Delivered On
            </AppText>

            <AppText variant="bodySmall" >
              {item.deliveredDate}{' '}•{' '} {item.deliveredTime}
            </AppText>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.detailsBtn}
            onPress={() =>
              navigation.navigate(
                'OrderDetails',
                {
                  order: item,
                }
              )
            }
          >

            <AppText variant="label" style={{ color: palette.primary, }}  >
              Details
            </AppText>

            <Ionicons
              name="arrow-forward"
              size={normalize(16)}
              color={palette.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Screen
      scrollable={false}
      backgroundColor={palette.creme}
    >

      <FlatList
        data={mockHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: hp(4),
        }}
        ListHeaderComponent={
          <>
            {/* HERO */}
            <ImageBackground
              source={require('../../assets/placeholder/feed-bg.png')}
              style={styles.headerBg}
            >
              <View style={styles.headerOverlay} >
                <AppText variant="h3" style={styles.headerText}  >
                  All Orders
                </AppText>

                <AppText variant="bodyLarge" style={styles.headerSubtext} >
                  Track all completed and active deliveries
                </AppText>
              </View>
            </ImageBackground>

            {/* SUMMARY */}
            <View style={styles.summaryWrapper}   >
              <View style={styles.summaryCard}  >
                <View style={styles.summaryBlock}  >
                  <AppText variant="caption" style={styles.summaryLabel}  >
                    TODAY
                  </AppText>

                  <AppText variant="h4" >
                    {todayOrders}
                  </AppText>

                  <AppText variant="bodySmall">
                    Orders
                  </AppText>
                </View>

                <View style={styles.summaryDivider} />
                <View style={styles.summaryBlock}>
                  <AppText variant="caption" style={styles.summaryLabel}  >
                    TOTAL
                  </AppText>

                  <AppText variant="h4" >
                    {mockHistory.length}
                  </AppText>

                  <AppText variant="bodySmall" >
                    Collections
                  </AppText>
                </View>
              </View>
            </View>
          </>
        }
      />

    </Screen>
  );
}

const styles = StyleSheet.create({

  headerBg: {
    height: hp(22),
  },

  headerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(3),
    paddingHorizontal: wp(6),
  },

  headerText: {
    color: palette.white,
  },

  headerSubtext: {
    color: palette.white,
    opacity: 0.9,
    marginTop: hp(0.5),
    textAlign: 'center',
  },

  summaryWrapper: {
    marginTop: -hp(4.8),
    marginHorizontal:
      wp(4),
    marginBottom: hp(2),
  },

  summaryCard: {
    backgroundColor:
      palette.white,
    borderRadius: normalize(28),
    paddingVertical:
      hp(2.2),
    paddingHorizontal: wp(2),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: normalize(10),
    shadowOffset: {
      width: 0,
      height: normalize(4),
    },
    elevation: 4,
  },

  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },

  summaryDivider: {
    width: 1,
    height: hp(8.5),
    backgroundColor:
      palette.border,
  },

  summaryLabel: {
    color: palette.stone,
    marginBottom: hp(0.5),
    letterSpacing: normalize(1),
  },

  orderCard: {
    backgroundColor:
      palette.white,
    marginHorizontal:
      wp(4),
    marginBottom:
      hp(2),
    borderRadius: normalize(24),
    padding: wp(4.5),
    borderWidth: 1,
    borderColor:
      palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: normalize(8),
    shadowOffset: {
      width: 0,
      height: normalize(3),
    },
    elevation: 3,
  },

  orderTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  orderLabel: {
    color: palette.stone,
    letterSpacing: normalize(1),
    marginBottom: hp(0.5),
  },

  statusPill: {
    paddingHorizontal: wp(3.6),
    paddingVertical: hp(1),
    borderRadius: normalize(30),
  },

  restaurantRow: {
    flexDirection: 'row',
    marginTop: hp(2),
    alignItems: 'center',
  },

  restaurantIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor:
      palette.radish,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },

  address: {
    marginTop: hp(0.25),
    color: palette.stone,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(2),
  },

  metricCard: {
    flex: 1,
    backgroundColor:
      palette.radish,
    borderRadius: normalize(18),
    paddingVertical:
      hp(1.8),
    alignItems: 'center',
  },

  metricLabel: {
    color: palette.stone,
    marginBottom: hp(0.7),
  },

  bottomRow: {
    marginTop: hp(2),
    paddingTop: hp(1.8),
    borderTopWidth: 1,
    borderTopColor:
      palette.border,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  dateLabel: {
    color: palette.stone,
    marginBottom: hp(0.5),
  },

  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      palette.radish,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: normalize(30),
    gap: wp(1.5),
  },
});