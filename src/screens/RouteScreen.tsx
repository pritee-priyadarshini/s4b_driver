import React, {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  ImageBackground,
  Platform,
} from "react-native";

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import BottomSheet from "@gorhom/bottom-sheet";

import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";

import { palette } from "../theme/colors";
import { spacing } from "../theme/spacing";

const { width, height } =
  Dimensions.get("window");

type RouteStatus =
  | "Assigned"
  | "Heading to Pickup"
  | "Picked Up"
  | "Delivered";

const MOCK_PICKUP = {
  id: "S4B-2094",
  status: "Heading to Pickup" as RouteStatus,
  progress: 0.42,
  eta: 18,
  distance: 6.4,
  servings: 42,
  restaurant: {
    name: "Fresh Bowl Kitchen",
    address: "Koramangala 5th Block, Bangalore",
    phone: "+91 9876543210",
    latitude: 12.9352,
    longitude: 77.6245,
  },

  charity: {
    name: "Hope Food Foundation",
    address: "Indiranagar, Bangalore",
    phone: "+91 9123456780",
    latitude: 12.9716,
    longitude: 77.5946,
  },

  driver: {
    name: "Raju Kumar",
    vehicle: "KA 05 MQ 2211",
    rating: 4.8,
  },

  items: [
    {
      name: "Cooked Rice",
      qty: 12,
    },

    {
      name: "Bread",
      qty: 8,
    },

    {
      name: "Dal Curry",
      qty: 15,
    },

    {
      name: "Packed Meals",
      qty: 7,
    },
  ],
};

export function RouteScreen() {

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(
    () => ["18%", "48%", "88%"],
    []
  );
  const [live] = useState(true);

  const pickup = MOCK_PICKUP;

  const restaurant = {
    latitude: pickup.restaurant.latitude,
    longitude: pickup.restaurant.longitude,
  };

  const charity = {
    latitude: pickup.charity.latitude,
    longitude: pickup.charity.longitude,
  };

  const driverLocation = {
    latitude: restaurant.latitude + (charity.latitude - restaurant.latitude) * pickup.progress,
    longitude: restaurant.longitude + (charity.longitude - restaurant.longitude) * pickup.progress,
  };

  const totalQty = useMemo(() => {
    return pickup.items.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );

  }, []);

  const openNavigation = () => {
    const url = Platform.OS === "ios"
      ? `maps://app?daddr=${charity.latitude},${charity.longitude}`
      : `google.navigation:q=${charity.latitude},${charity.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation
        showsMyLocationButton
      >

        {/* ROUTE */}
        <Polyline
          coordinates={[
            restaurant,
            charity,
          ]}
          strokeWidth={5}
          strokeColor={palette.primary}
        />

        {/* DRIVER */}
        <Marker coordinate={driverLocation}>
          <View style={styles.driverMarker}>
            <Ionicons
              name="car"
              size={18}
              color={palette.white}
            />
          </View>
        </Marker>

        {/* RESTAURANT */}
        <Marker coordinate={restaurant}>
          <View style={styles.pickupMarker}>
            <Ionicons
              name="restaurant"
              size={18}
              color={palette.white}
            />
          </View>
        </Marker>

        {/* CHARITY */}
        <Marker coordinate={charity}>
          <View style={styles.dropMarker} >
            <Ionicons
              name="home"
              size={18}
              color={palette.white}
            />
          </View>
        </Marker>

      </MapView>

      {/* TOP HEADER */}
      <View style={styles.topOverlay}>
        <ImageBackground
          source={require("../../assets/placeholder/feed-bg.png")}
          style={styles.routeHero}
          imageStyle={{ borderRadius: 24, }}
        >
          <View style={styles.heroTop}>
            <View>
              <AppText variant="caption" style={styles.heroLabel} >
                ACTIVE DELIVERY
              </AppText>

              <AppText variant="h4" style={styles.white}>
                {pickup.id}
              </AppText>

            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} ></View>
              <AppText variant="label" style={styles.white} >
                LIVE
              </AppText>
            </View>
          </View>

          <View style={styles.heroBottom}>
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
                {pickup.distance}km
              </AppText>
            </View>

            <View style={styles.heroMetric} >

              <AppText variant="caption" style={styles.metricCaption}>
                FOOD
              </AppText>

              <AppText variant="h5" style={styles.white}>
                {totalQty}kg
              </AppText>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* BOTTOM SHEET */}

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={{ backgroundColor: palette.creme, }}
        handleIndicatorStyle={{ backgroundColor: palette.border, }}
      >
        <View style={styles.sheet}>
          {/* STATUS */}
          <View style={styles.statusCard} >
            <View>
              <AppText variant="caption" style={styles.label} >
                CURRENT STATUS
              </AppText>

              <View style={styles.statusPill} >

                <AppText variant="label" style={{ color: palette.white, }} >
                  {pickup.status}
                </AppText>
              </View>
            </View>
            <View style={styles.progressCircle}>
              <AppText variant="bodyBold" >
                {Math.round(pickup.progress * 100)} %
              </AppText>
            </View>
          </View>

          {/* LOCATION CARDS */}
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons
                name="restaurant"
                size={18}
                color={palette.white}
              />
            </View>

            <View style={{ flex: 1, }}>
              <AppText variant="label" style={styles.locationLabel}  >
                PICKUP POINT
              </AppText>

              <AppText variant="bodyBold"  >
                {pickup.restaurant.name}
              </AppText>

              <AppText variant="bodySmall" style={styles.locationSub}   >
                📍{" "}{pickup.restaurant.address}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() =>
                Linking.openURL(
                  `tel:${pickup.restaurant.phone}`
                )
              }
            >

              <Ionicons
                name="call"
                size={18}
                color={palette.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.locationCard} >
            <View style={[styles.locationIcon, { backgroundColor: palette.middlegreen, },]} >
              <Ionicons
                name="home"
                size={18}
                color={palette.white}
              />
            </View>

            <View style={{ flex: 1, }}  >
              <AppText variant="label" style={styles.locationLabel}  >
                DELIVERY POINT
              </AppText>

              <AppText variant="bodyBold"  >
                {pickup.charity.name}
              </AppText>

              <AppText variant="bodySmall" style={styles.locationSub} >
                📍{" "}{pickup.charity.address}
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() =>
                Linking.openURL(
                  `tel:${pickup.charity.phone}`
                )
              }
            >

              <Ionicons
                name="call"
                size={18}
                color={palette.primary}
              />
            </TouchableOpacity>
          </View>

          {/* FOOD DETAILS */}
          <View style={styles.foodCard}>
            <View style={styles.foodHeader}>
              <AppText variant="bodyBold" >
                Food Manifest
              </AppText>

              <View style={styles.qtyBadge} >
                <AppText variant="label" style={{ color: palette.white, }}>
                  {totalQty}kg
                </AppText>
              </View>
            </View>

            {pickup.items.map(
              (item) => (
                <View
                  key={item.name}
                  style={styles.foodRow}
                >

                  <View style={styles.foodLeft}  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={palette.success}
                    />
                    <AppText variant="bodySmall"  >
                      {item.name}
                    </AppText>
                  </View>

                  <AppText variant="bodyBold">
                    {item.qty}kg
                  </AppText>
                </View>
              )
            )}
          </View>

          {/* DRIVER */}
          <View style={styles.driverCard} >
            <View style={styles.driverAvatar}  >
              <AppText variant="h6" style={styles.white}>
                RK
              </AppText>

            </View>

            <View style={{  flex: 1, }}  >
              <AppText  variant="bodyBold" >
                { pickup.driver  .name }
              </AppText>

              <AppText  variant="bodySmall" >
                {  pickup.driver   .vehicle  }
              </AppText>
            </View>

            <View  style={ styles.ratingPill  }  >
              <Ionicons
                name="star"
                size={14}
                color={   palette.white  }
              />

              <AppText  variant="label" style={{  color:  palette.white,  }} >
                {  pickup.driver.rating }
              </AppText>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.actionRow } >
            <Button
              label="Continue Trip"
              style={ styles.tripBtn}
              onPress={() => { }}
            />

            <TouchableOpacity
              style={styles.navBtn }
              onPress={ openNavigation }
            >

              <Ionicons
                name="navigate"
                size={22}
                color={ palette.white }
              />
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: palette.creme,
  },

  map: {
    width,
    height,
  },

  topOverlay: {
    position: "absolute",
    top: 55,
    left: spacing.md,
    right: spacing.md,
  },

  routeHero: {
    padding: spacing.lg,
    overflow: "hidden",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroLabel: {
    color: palette.white,
    opacity: 0.9,
    letterSpacing: 1,
  },

  white: {
    color: palette.white,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00000030",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },

  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },

  heroMetric: {
    alignItems: "center",
  },

  metricCaption: {
    color: palette.white,
    opacity: 0.8,
  },

  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: palette.white,
  },

  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.chilli,
    justifyContent: "center",
    alignItems: "center",
  },

  dropMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.middlegreen,
    justifyContent: "center",
    alignItems: "center",
  },

  sheet: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },

  statusCard: {
    backgroundColor: palette.white,
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    color: palette.stone,
    letterSpacing: 1,
  },

  statusPill: {
    marginTop: spacing.sm,
    backgroundColor: palette.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
  },

  progressCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.radish,
    justifyContent: "center",
    alignItems: "center",
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },

  locationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  locationLabel: {
    color: palette.stone,
    marginBottom: 4,
    letterSpacing: 1,
  },

  locationSub: {
    marginTop: 4,
    color: palette.stone,
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.radish,
    justifyContent: "center",
    alignItems: "center",
  },

  foodCard: {
    backgroundColor: palette.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
  },

  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  qtyBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },

  foodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  driverCard: {
    backgroundColor: palette.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },

  tripBtn: {
    flex: 1,
    backgroundColor: palette.primary,
  },

  navBtn: {
    width: 62,
    borderRadius: 18,
    backgroundColor: palette.black,
    justifyContent: "center",
    alignItems: "center",
  },

});