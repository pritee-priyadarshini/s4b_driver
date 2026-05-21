import React, { useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    ImageBackground,
    Pressable,
    Dimensions,
} from 'react-native';

import { NativeStackScreenProps, } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { RootStackParamList, } from '../navigation/types';

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const normalize = (size: number) => {
  const scale = width / 375;
  return Math.round(size * scale);
};


type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

export function OrderDetailsScreen({ route, }: Props) {
    const navigation = useNavigation();
    const { order } = route.params;
    const totalQty = useMemo(() => {
        return order.items.reduce(
            (sum, item) => sum + item.qty,
            0
        );
    }, [order.items]);

    return (
        <Screen backgroundColor={palette.creme}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: spacing.xxl,
                }}
            >
                {/* HEADER */}
                <ImageBackground
                    source={require('../../assets/placeholder/feed-bg.png')}
                    style={styles.headerBg}
                >
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={palette.white} />
                    </Pressable>

                    <View style={styles.headerOverlay}>
                        <AppText variant="h4" style={styles.headerText}  >
                            Order Details
                        </AppText>
                    </View>
                </ImageBackground>

                <View style={styles.container}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTop}>
                            <View>
                                <AppText variant="caption" style={styles.label}  >
                                    ORDER ID
                                </AppText>

                                <AppText variant="h6">
                                    {order.orderId}
                                </AppText>
                            </View>

                            <View style={styles.statusPill}>
                                <AppText   variant="label"  style={{  color: palette.white,  }}   >
                                    {order.status}
                                </AppText>
                            </View>
                        </View>

                        <View style={styles.metricsRow}>
                            <View style={styles.metricCard}>
                                <AppText variant="caption" style={styles.metricLabel}>
                                    Assigned
                                </AppText>

                                <AppText variant="bodyBold">
                                    {order.assignedDate}
                                </AppText>

                                <AppText variant="bodySmall"  style={styles.metricSub}>
                                    {order.assignedTime}
                                </AppText>
                            </View>

                            {/* DELIVERED */}
                            <View style={styles.metricCard}>
                                <AppText variant="caption" style={styles.metricLabel} >
                                    Delivered
                                </AppText>

                                <AppText variant="bodyBold">
                                    {order.deliveredDate}
                                </AppText>

                                <AppText variant="bodySmall"  style={styles.metricSub} >
                                    {order.deliveredTime}
                                </AppText>
                            </View>
                        </View>
                    </View>

                    
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons
                                    name="restaurant-outline"
                                    size={18}
                                    color={palette.primary}
                                />
                            </View>
                            <AppText variant="bodyBold">
                                Collected From
                            </AppText>
                        </View>

                        <View style={styles.infoBlock}>
                            <AppText variant="caption" style={styles.label} >
                                RESTAURANT NAME
                            </AppText>

                            <AppText variant="bodyLarge">
                                {order.restaurant.name}
                            </AppText>
                        </View>

                        <View style={styles.infoBlock}>
                            <AppText variant="caption" style={styles.label} >
                                ADDRESS
                            </AppText>

                            <AppText variant="bodySmall">
                                📍 {order.restaurant.address}
                            </AppText>
                        </View>

                        <View style={styles.itemsContainer}>
                            <View style={styles.tableHeader}>
                                <AppText variant="label">
                                    Item
                                </AppText>

                                <AppText variant="label">
                                    Quantity
                                </AppText>
                            </View>

                            {order.items.map((item) => (
                                <View key={item.name}  style={styles.tableRow} >
                                    <View style={styles.itemLeft}>
                                        <AppText variant="bodySmall">
                                            {item.name}
                                        </AppText>
                                    </View>

                                    <View style={styles.qtyPill}>
                                        <AppText  variant="label"   style={{   color: palette.primary,   }}  >
                                            {item.qty} kg
                                        </AppText>
                                    </View>
                                </View>
                            ))}

                            {/* TOTAL */}

                            <View style={styles.totalRow}>
                                <AppText variant="bodyBold">
                                    Total Quantity
                                </AppText>

                                <View style={styles.totalPill}>
                                    <AppText  variant="bodyBold"   style={{ color: palette.white,  }}   >
                                        {totalQty} kg
                                    </AppText>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons
                                    name="heart-outline"
                                    size={18}
                                    color={palette.primary}
                                />
                            </View>

                            <AppText variant="bodyBold">
                                Delivered To
                            </AppText>
                        </View>

                        <View style={styles.infoBlock}>
                            <AppText variant="caption"  style={styles.label}  >
                                CHARITY NAME
                            </AppText>

                            <AppText variant="bodyLarge">
                                {order.charity.name}
                            </AppText>
                        </View>

                        <View style={styles.infoBlock}>
                            <AppText   variant="caption"  style={styles.label}  >
                                ADDRESS
                            </AppText>

                            <AppText variant="bodySmall">
                                📍 {order.charity.address}
                            </AppText>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons
                                    name="star-outline"
                                    size={18}
                                    color={palette.primary}
                                />
                            </View>

                            <AppText variant="bodyBold">
                                Collection feedback
                            </AppText>
                        </View>

                        <View style={styles.ratingCard}>
                            <View>
                                <AppText  variant="caption" style={styles.label}  >
                                    DRIVER EXPERIENCE
                                </AppText>

                                <View style={styles.ratingRow}>
                                    {[...Array(order.driverRating)].map((_, index) => (
                                        <AppText
                                            key={`driver-${index}`}
                                            style={styles.tomato}
                                        >
                                            🍅
                                        </AppText>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <AppText variant="caption" style={styles.label}  >
                                    RESTAURANT EXPERIENCE
                                </AppText>

                                <View style={styles.ratingRow}>
                                    {[...Array(order.restaurantRating)].map((_, index) => (
                                        <AppText
                                            key={`restaurant-${index}`}
                                            style={styles.tomato}
                                        >
                                            🍅
                                        </AppText>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({

    headerBg: {
        height: hp(21),
    },

    headerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: spacing.lg,
    },

    headerText: {
        color: palette.white,
        marginBottom: spacing.sm,
    },

    backBtn: {
        position: 'absolute',
        left: spacing.md,
        top: spacing.lg,
    },

    statusPill: {
        backgroundColor: palette.success,
        paddingHorizontal: wp(4.5),
        paddingVertical: hp(1),
        borderRadius: normalize(30),
    },

    container: {
        padding: spacing.md,
        gap: spacing.md,
    },

    summaryCard: {
        backgroundColor: palette.white,
        borderRadius: normalize(24),
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
        gap: spacing.md,
    },

    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    deliveryIcon: {
        width: normalize(50),
        height: normalize(50),
        borderRadius: normalize(25),
        backgroundColor: palette.radish,
        alignItems: 'center',
        justifyContent: 'center',
    },

    metricsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },

    metricCard: {
        flex: 1,
        backgroundColor: palette.radish,
        borderRadius: normalize(18),
        padding: spacing.md,
    },

    metricLabel: {
        color: palette.stone,
        marginBottom: spacing.xs,
    },

    metricSub: {
        marginTop: spacing.xs,
        color: palette.stone,
    },

    card: {
        backgroundColor: palette.white,
        borderRadius: normalize(24),
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.lg,
        gap: spacing.md,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    sectionIcon: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(18),
        backgroundColor: palette.radish,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },

    infoBlock: {
        gap: spacing.xs,
    },

    label: {
        color: palette.stone,
        letterSpacing: 1,
    },

    itemsContainer: {
        marginTop: spacing.sm,
        backgroundColor: palette.radish,
        borderRadius: normalize(20),
        padding: spacing.md,
    },

    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingBottom: spacing.sm,
        marginBottom: spacing.sm,
    },

    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },

    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },

    qtyPill: {
        backgroundColor: palette.white,
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.75),
        borderRadius: normalize(20),
    },

    totalRow: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    totalPill: {
        backgroundColor: palette.primary,
        paddingHorizontal: wp(4.5),
        paddingVertical: hp(1.25),
        borderRadius: normalize(24),
    },

    ratingCard: {
        backgroundColor: palette.radish,
        borderRadius: normalize(20),
        padding: spacing.md,
        gap: spacing.lg,
    },

    ratingRow: {
        flexDirection: 'row',
        marginTop: spacing.sm,
    },

    tomato: {
        fontSize: normalize(28),
        lineHeight: normalize(34),
        marginRight: wp(1),
    },
});