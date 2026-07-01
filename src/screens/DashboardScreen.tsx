import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    Linking,
    Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { HeroHeader } from '../components/HeroHeader';
import { Card } from '../components/Card';
import { OsmMapView } from '../components/OsmMapView';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';

import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const normalize = (size: number) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

type DeliveryStatus =
    | 'Assigned'
    | 'Enroute'
    | 'Arrived'
    | 'Picked'
    | 'Verified'
    | 'Completed';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PickupItem = {
    name: string;
    qty: number;
};

const mockPickups = [
    {
        id: '1',
        title: 'Pizza Hut',
        address: 'MG Road, Bangalore',
        contact: '+91 98765 43210',
        distance: '2.1 km',
        items: [
            { name: 'Bread', qty: 5 },
            { name: 'Rice', qty: 10 },
        ],
        date: '12/04/26',
        time: '2:00 PM - 4:00 PM',
        storage: '❄ Refrigeration Required',
        lat: 12.9716,
        lng: 77.5946,
        status: 'Assigned' as DeliveryStatus,
    },
    {
        id: '2',
        title: 'Welspoon Hotel',
        address: 'Hossur Road, Bangalore',
        contact: '+91 98765 55555',
        distance: '10.1 km',
        items: [
            { name: 'Cooked Food', qty: 5 },
            { name: 'Rice', qty: 10 },
        ],
        date: '12/04/26',
        time: '5:00 PM - 8:00 PM',
        storage: '❄ Refrigeration Required',
        lat: 12.9352,
        lng: 77.6245,
        status: 'Assigned' as DeliveryStatus,
    },
    {
        id: '3',
        title: 'Hotel Red Dragon',
        address: 'Marathahalli, Bangalore',
        contact: '+91 98765 11111',
        distance: '8.1 km',
        items: [
            { name: 'Cooked Food', qty: 15 },
            { name: 'Raw vegetables', qty: 8 },
        ],
        date: '12/04/26',
        time: '3:00 PM - 6:00 PM',
        storage: '❄ Refrigeration Required',
        lat: 12.9591,
        lng: 77.6974,
        status: 'Assigned' as DeliveryStatus,
    },
];

export function DashboardScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [data, setData] = useState(mockPickups);
    const [selectedItems, setSelectedItems] = useState<PickupItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [sharing, setSharing] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [confirmedPickupId, setConfirmedPickupId] = useState<string | null>(null);

    const totalQty = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + (item.qty || 0), 0);
    }, [selectedItems]);

    useTransparentStatusBar('light');

    useFocusEffect(
        useCallback(() => {
            if (confirmedPickupId) {
                updateStatus(confirmedPickupId, 'Verified');
                setConfirmedPickupId(null);
            }

        }, [confirmedPickupId])
    );

    const statusFlow: DeliveryStatus[] = [
        'Assigned',
        'Enroute',
        'Arrived',
        'Picked',
        'Verified',
        'Completed',
    ];

    const getNextStatus = (current: DeliveryStatus) => {
        const index = statusFlow.indexOf(current);
        return statusFlow[index + 1] || null;
    };

    /* SORT */
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const d1 = new Date(a.date.split('/').reverse().join('-'));
            const d2 = new Date(b.date.split('/').reverse().join('-'));
            return d1.getTime() - d2.getTime();
        });
    }, [data]);

    const statusColor = (status: DeliveryStatus) => {
        switch (status) {
            case 'Assigned':
                return palette.orange;
            case 'Enroute':
                return palette.blueberry;
            case 'Arrived':
                return palette.kale;
            case 'Picked':
                return palette.primary;
            case 'Verified':
                return palette.chilli;
            case 'Completed':
                return palette.middlegreen;
            default:
                return palette.stone;
        }
    };

    const updateStatus = (id: string, status: DeliveryStatus) => {
        setData((prev) => {
            if (status === 'Completed') {
                return prev.filter((item) => item.id !== id);
            }

            return prev.map((item) =>
                item.id === id ? { ...item, status } : item
            );
        });
    };

    const listRef = useRef<FlatList>(null);

    const cardElevation = Platform.select({
        ios: {
            shadowColor: palette.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 10,
        },
        android: { elevation: 3 },
    });

    const renderItem = ({ item }: { item: typeof mockPickups[number]; }) => (
        <View style={[styles.card, cardElevation]}>
            {/* TOP */}
            <View style={styles.rowBetween}>
                <View>
                    <AppText variant="bodyLarge">{item.title}</AppText>
                    <AppText variant="bodySmall" style={{ marginTop: 10 }}>{item.address}</AppText>
                </View>

                <View style={styles.distancePill}>
                    <AppText variant="label">📍 {item.distance}</AppText>
                </View>
            </View>

            {/* INLINE */}
            <View style={styles.inlineRow}>
                <View style={styles.inlineCard}>
                    <AppText variant="label">Items</AppText>
                    <Button
                        label="View"
                        style={{
                            height: hp(3.75),
                            marginTop: hp(0.6),
                            paddingHorizontal: wp(4.5),
                            paddingVertical: 0,
                            minHeight: 0,
                            backgroundColor: palette.middlegreen,
                        }}
                        onPress={() => {
                            setSelectedItems(item.items);
                            setModalVisible(true);
                        }}
                    />
                </View>

                <View style={styles.inlineCard}>
                    <AppText variant="label">Date</AppText>
                    <AppText variant="bodySmall" style={{ marginTop: 10 }}>{item.date}</AppText>
                </View>

                <View style={styles.inlineCard}>
                    <AppText variant="label">Time</AppText>
                    <AppText variant="bodySmall" style={{ marginTop: 6, textAlign: 'center' }}>{item.time}</AppText>
                </View>
            </View>

            <View style={styles.contactRow}>
                <AppText variant='label'> Contact:</AppText>

                <View style={styles.contactActions}>
                    <TouchableOpacity
                        style={styles.contactPill}
                        onPress={() => Linking.openURL(`tel:${item.contact}`)}
                    >
                        <AppText variant='label' style={{lineHeight: hp(2.5), paddingHorizontal: wp(2)}}>📞 Call</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactPill}
                        onPress={() => Linking.openURL(`sms:${item.contact}`)}
                    >
                        <AppText variant='label' style={{lineHeight: hp(2.5), paddingHorizontal: wp(2)}}>💬 Message</AppText>
                    </TouchableOpacity>
                </View>
            </View>

            <AppText variant="bodyLarge" style={{ marginBottom: 10 }}>{item.storage}</AppText>

            {/* STATUS + CTA */}
            <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppText variant='label' style={{ marginRight: spacing.xs }}>Status</AppText>
                    <View
                        style={[
                            styles.statusPill,
                            { backgroundColor: statusColor(item.status) },
                        ]}
                    >
                        <AppText variant='bodyBold' style={{ color: palette.white }}> {item.status} </AppText>
                    </View>
                </View>

                {activeId !== item.id ? (
                    <Button
                        label="Collect Now"
                        style={styles.collectBtn}
                        onPress={() => setActiveId(item.id)}
                    />
                ) : item.status !== 'Completed' ? (
                    <Button
                        label={getNextStatus(item.status) || 'Done'}
                        style={styles.collectBtn}
                        onPress={() => {
                            const next = getNextStatus(item.status);
                            if (next === 'Picked') {
                                navigation.navigate('PickupConfirm', {
                                    pickup: item,
                                    onConfirm: (id: string) => {
                                        updateStatus(id, 'Verified');
                                    },
                                });
                            } else if (next) {
                                updateStatus(item.id, next);
                            }
                        }}
                    />
                ) : null}
            </View>

            {/* SHARE */}
            <TouchableOpacity
                style={styles.shareBtn}
                onPress={() =>
                    setSharing(sharing === item.id ? null : item.id)
                }
            >
                <AppText variant='bodyBold' style={{ color: palette.white }}>
                    {sharing === item.id
                        ? 'Stop Sharing'
                        : 'Share Live Location'}
                </AppText>
            </TouchableOpacity>
        </View>
    );

    const Header = () => (
        <View>
            <HeroHeader
                source={require('../../assets/placeholder/feed-bg.png')}
                height={hp(20)}
                contentStyle={styles.heroContent}
            >
                <StatusBar style="light" />
                <AppText variant="h4" style={styles.headerText}>
                    My Pickups
                </AppText>
                <AppText variant="bodySmall" style={styles.headerSubtext}>
                    {sortedData.length} assigned today
                </AppText>
            </HeroHeader>

            {/* AVAILABILITY */}
            <View style={styles.availabilityRow}>
                <AppText variant="subheading"> Are you ready for delivery? </AppText>

                <TouchableOpacity
                    activeOpacity={0.6}
                    style={[
                        styles.switchContainer,
                        isAvailable ? styles.switchOn : styles.switchOff,
                    ]}
                    onPress={() => {
                        const next = !isAvailable;
                        setIsAvailable(next);
                    }}
                >
                    <AppText variant='label'
                        style={[
                            styles.switchLabel,
                            isAvailable ? styles.labelLeft : styles.labelRight,
                        ]}
                    >
                        {isAvailable ? 'Yes' : 'No'}
                    </AppText>

                    <View
                        style={[
                            styles.switchThumb,
                            isAvailable ? styles.thumbRight : styles.thumbLeft,
                        ]}
                    />
                </TouchableOpacity>
            </View>

            {/* TOGGLE */}
            <View style={styles.toggleWrapper}>
                {['list', 'map'].map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[
                            styles.toggleBtn,
                            viewMode === mode && styles.toggleActive,
                        ]}
                        onPress={() => setViewMode(mode as any)}
                    >
                        <AppText variant='label' style={viewMode === mode ? styles.toggleTextActive : styles.toggleText} >
                            {mode.toUpperCase()}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </View>

            {/* COUNT */}
            <View style={styles.rowBetween}>
                <AppText variant='h7'>Assigned Pickups</AppText>

                <View style={styles.countPill}>
                    <AppText variant='label' style={{ color: palette.white }}>
                        {sortedData.length}
                    </AppText>
                </View>
            </View>
        </View>
    );

    const MapViewComponent = () => (
        <View>
            <Card style={styles.mapCard}>
                <OsmMapView
                    style={styles.map}
                    markers={sortedData.map((item) => ({
                        latitude: item.lat,
                        longitude: item.lng,
                    }))}
                    initialCenter={
                        sortedData[0]
                            ? { latitude: sortedData[0].lat, longitude: sortedData[0].lng }
                            : undefined
                    }
                    initialZoom={12}
                />
            </Card>

            {/* HORIZONTAL CARD LIST */}
            <FlatList
                ref={listRef}
                data={sortedData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
        </View>
    );

    return (
        <Screen scrollable={false} backgroundColor={palette.creme} transparentTop>
            <View>
                {viewMode === 'list' ? (
                    <FlatList
                        data={sortedData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ListHeaderComponent={Header}
                    />
                ) : (
                    <FlatList
                        data={[{ key: 'map' }]}
                        keyExtractor={(item) => item.key}
                        renderItem={() => (
                            <>
                                <Header />
                                <MapViewComponent />
                            </>
                        )}
                    />
                )}
            </View>

            {/* MODAL */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setModalVisible(false)
                }>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <AppText
                            variant="bodyBold"
                            style={{ textAlign: 'center', marginBottom: spacing.sm, }}
                        >
                            Item List
                        </AppText>

                        <FlatList
                            data={selectedItems}
                            keyExtractor={(_, i) => i.toString()}
                            style={{ maxHeight: hp(80) }}
                            renderItem={({ item }) => (
                                <View style={styles.rowBetween}>
                                    <AppText variant='bodySmall'>{item.name}</AppText>
                                    <AppText variant='bodySmall'>{item.qty}kg</AppText>
                                </View>
                            )}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* TOTAL */}
                        <View
                            style={[
                                styles.rowBetween,
                                {
                                    marginTop: spacing.sm,
                                    borderTopWidth: 1,
                                    borderColor: palette.border,
                                    paddingTop: spacing.sm,
                                },
                            ]}
                        >
                            <AppText variant='bodyBold'>Total</AppText>
                            <AppText variant='bodyBold'>{totalQty} kg</AppText>
                        </View>

                        <Button
                            label="Close"
                            style={{
                                minHeight: hp(3.5),
                                height: hp(3.5),
                                paddingHorizontal: wp(5),
                                alignSelf: 'center',
                                marginTop: spacing.sm,
                            }}
                            onPress={() => setModalVisible(false)}
                        />
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    heroContent: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    headerText: { color: palette.white },
    headerSubtext: {
        color: palette.white,
        opacity: 0.9,
        marginTop: spacing.xs,
    },
    mapCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: 0,
        overflow: 'hidden',
        borderRadius: 20,
    },
    map: {
        height: hp(40),
        width: '100%',
    },

    toggleWrapper: {
        flexDirection: 'row',
        margin: spacing.md,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: normalize(20),
    },
    toggleBtn: {
        flex: 1,
        padding: spacing.sm,
        alignItems: 'center',
    },
    toggleActive: {
        backgroundColor: palette.primary,
        borderRadius: normalize(20),
    },
    toggleText: { color: palette.black },
    toggleTextActive: { color: palette.white },

    rowBetween: {
        marginHorizontal: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    countPill: {
        backgroundColor: palette.success,
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        borderRadius: normalize(12),
    },

    card: {
        backgroundColor: palette.white,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        padding: spacing.sm,
        gap: spacing.sm,
        borderRadius: normalize(16),
        borderWidth: 1,
        borderColor: palette.border,
    },

    distancePill: {
        backgroundColor: palette.radish,
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: normalize(20),
    },

    inlineRow: {
        flexDirection: 'row',
        marginVertical: spacing.md,
    },

    inlineCard: {
        flex: 1,
        backgroundColor: palette.radish,
        padding: spacing.sm,
        marginHorizontal: wp(1),
        borderRadius: normalize(10),
        alignItems: 'center',
    },

    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },

    contactNumber: {
        flex: 1,
        marginRight: spacing.sm,
    },

    contactActions: {
        flexDirection: 'row',
        gap: wp(2),
    },

    contactPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.radish,
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.75),
        borderRadius: normalize(20),
        borderWidth: 1,
        borderColor: palette.border,
    },

    statusPill: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.25),
        borderRadius: normalize(20),
    },

    collectBtn: {
        height: hp(5),
        paddingHorizontal: wp(3),
        paddingVertical: 0,
        minHeight: 0,
    },

    shareBtn: {
        marginTop: spacing.sm,
        backgroundColor: palette.primary,
        padding: spacing.md,
        borderRadius: normalize(10),
        alignItems: 'center',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000055',
    },

    modalBox: {
        width: wp(75),
        maxHeight: hp(80),
        backgroundColor: palette.white,
        padding: spacing.md,
        borderRadius: normalize(16),
    },
    availabilityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    switchContainer: {
        width: wp(22),
        height: hp(5),
        borderRadius: normalize(25),
        justifyContent: 'center',
        position: 'relative',
        paddingHorizontal: wp(1.5),
    },

    switchOn: {
        backgroundColor: palette.success,
    },

    switchOff: {
        backgroundColor: palette.danger,
    },

    switchThumb: {
        width: normalize(34),
        height: normalize(34),
        borderRadius: normalize(17),
        backgroundColor: palette.white,
        position: 'absolute',
        top: hp(0.4),
    },

    thumbRight: {
        right: wp(0.8),
    },

    thumbLeft: {
        left: wp(0.8),
    },

    switchLabel: {
        color: palette.white,
    },

    labelLeft: {
        alignSelf: 'flex-start',
        marginLeft: wp(2.5),
    },

    labelRight: {
        alignSelf: 'flex-end',
        marginRight: wp(2.5),
    },
});