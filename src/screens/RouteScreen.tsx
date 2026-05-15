import React, { useMemo, useRef } from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
  ImageBackground,
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
import { Screen } from "../components/Screen";

import { palette } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { useTrip } from "../store/TripContext";

const { width, height } = Dimensions.get("window");

export function RouteScreen() {

  const {
    selectedPickup: pickup,
    progress,
    live,
    onStartTrip,
    onAdvanceStatus,
  } = useTrip();

  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(
    () => ["22%", "42%", "82%"],
    []
  );

  if (!pickup) {
    return (
      <Screen backgroundColor={palette.creme}>
        <View style={styles.emptyContainer}>

          <Ionicons
            name="map-outline"
            size={70}
            color={palette.stone}
          />

          <AppText
            variant="h5"
            style={styles.emptyTitle}
          >
            No Route Selected
          </AppText>

          <AppText
            variant="bodySmall"
            style={styles.emptySub}
          >
            Open a pickup from dashboard to
            start navigation.
          </AppText>

        </View>
      </Screen>
    );
  }

  const restaurant = {
    latitude: pickup.restaurant?.lat || 12.9716,
    longitude: pickup.restaurant?.lng || 77.5946,
  };

  const charity = {
    latitude: pickup.charity?.lat || 12.9352,
    longitude: pickup.charity?.lng || 77.6245,
  };

  const driverLocation = {
    latitude:
      restaurant.latitude +
      (charity.latitude - restaurant.latitude) *
      progress,

    longitude:
      restaurant.longitude +
      (charity.longitude -
        restaurant.longitude) *
      progress,
  };

  const nextAction =
    pickup.status === "assigned"
      ? "Start Trip"
      : pickup.status ===
        "heading-to-restaurant"
        ? "Picked Up"
        : pickup.status === "picked-up"
          ? "Complete Delivery"
          : "Completed";

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
        followsUserLocation
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
          <View style={styles.dropMarker}>
            <Ionicons
              name="home"
              size={18}
              color={palette.white}
            />
          </View>
        </Marker>

      </MapView>

      {/* TOP CARD */}

      <View style={styles.topOverlay}>

        <ImageBackground
          source={require("../../assets/placeholder/feed-bg.png")}
          style={styles.routeCard}
          imageStyle={{
            borderRadius: 18,
          }}
        >

          <View style={styles.rowBetween}>

            <View style={{ flex: 1 }}>

              <AppText
                variant="label"
                style={styles.white}
              >
                CURRENT PICKUP
              </AppText>

              <AppText
                variant="h5"
                style={styles.white}
              >
                {pickup.restaurant?.name ||
                  "Restaurant"}
              </AppText>

              <AppText
                variant="bodySmall"
                style={styles.routeSub}
              >
                {pickup.restaurant?.address}
              </AppText>

            </View>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={() =>
                Linking.openURL(
                  `tel:${pickup.restaurant?.phone}`
                )
              }
            >
              <Ionicons
                name="call"
                size={20}
                color={palette.primary}
              />
            </TouchableOpacity>

          </View>

        </ImageBackground>

      </View>

      {/* BOTTOM SHEET */}

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={1}
        enablePanDownToClose={false}
        backgroundStyle={{
          backgroundColor: palette.white,
        }}
        handleIndicatorStyle={{
          backgroundColor: palette.border,
        }}
      >

        <View style={styles.sheetContent}>

          {/* STATUS */}

          <View style={styles.statusRow}>

            <View>
              <AppText variant="label">
                DELIVERY STATUS
              </AppText>

              <View style={styles.statusPill}>
                <AppText
                  variant="bodyBold"
                  style={{
                    color: palette.white,
                  }}
                >
                  {pickup.status}
                </AppText>
              </View>
            </View>

            <View>
              <AppText variant="label">
                ETA
              </AppText>

              <AppText variant="h5">
                {Math.max(
                  1,
                  Math.round(
                    pickup.etaMinutes *
                    (1 - progress)
                  )
                )}{" "}
                min
              </AppText>
            </View>

          </View>

          {/* METRICS */}

          <View style={styles.metricRow}>

            <View style={styles.metricCard}>
              <AppText variant="label">
                Distance
              </AppText>

              <AppText variant="h6">
                {pickup.distanceKm} km
              </AppText>
            </View>

            <View style={styles.metricCard}>
              <AppText variant="label">
                Servings
              </AppText>

              <AppText variant="h6">
                {pickup.servings}
              </AppText>
            </View>

            <View style={styles.metricCard}>
              <AppText variant="label">
                Progress
              </AppText>

              <AppText variant="h6">
                {Math.round(progress * 100)}%
              </AppText>
            </View>

          </View>

          {/* PICKUP */}

          <View style={styles.locationCard}>

            <View style={styles.locationIcon}>
              <Ionicons
                name="restaurant"
                size={18}
                color={palette.white}
              />
            </View>

            <View style={{ flex: 1 }}>

              <AppText variant="bodyBold">
                Pickup Point
              </AppText>

              <AppText variant="bodySmall">
                {pickup.restaurant?.name}
              </AppText>

              <AppText variant="caption">
                {pickup.restaurant?.address}
              </AppText>

            </View>

          </View>

          {/* DELIVERY */}

          <View style={styles.locationCard}>

            <View
              style={[
                styles.locationIcon,
                {
                  backgroundColor:
                    palette.middlegreen,
                },
              ]}
            >
              <Ionicons
                name="home"
                size={18}
                color={palette.white}
              />
            </View>

            <View style={{ flex: 1 }}>

              <AppText variant="bodyBold">
                Delivery Point
              </AppText>

              <AppText variant="bodySmall">
                {pickup.charity?.name}
              </AppText>

              <AppText variant="caption">
                {pickup.charity?.address}
              </AppText>

            </View>

          </View>

          {/* ACTIONS */}

          <View style={styles.actionRow}>

            <Button
              label={
                live
                  ? nextAction
                  : "Start Trip"
              }
              style={styles.tripBtn}
              onPress={
                live
                  ? onAdvanceStatus
                  : onStartTrip
              }
            />

            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => {
                Linking.openURL(
                  `google.navigation:q=${charity.latitude},${charity.longitude}`
                );
              }}
            >
              <Ionicons
                name="navigate"
                size={22}
                color={palette.white}
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
    top: 50,
    left: spacing.md,
    right: spacing.md,
  },

  routeCard: {
    padding: spacing.md,
    overflow: "hidden",
  },

  white: {
    color: palette.white,
  },

  routeSub: {
    color: palette.white,
    marginTop: 4,
    opacity: 0.9,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  callBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.white,
    justifyContent: "center",
    alignItems: "center",
  },

  driverMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: palette.white,
  },

  pickupMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.chilli,
    justifyContent: "center",
    alignItems: "center",
  },

  dropMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.middlegreen,
    justifyContent: "center",
    alignItems: "center",
  },

  sheetContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusPill: {
    marginTop: 6,
    backgroundColor: palette.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
  },

  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  metricCard: {
    flex: 1,
    backgroundColor: palette.radish,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
  },

  locationCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: spacing.md,
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  tripBtn: {
    flex: 1,
    backgroundColor: palette.primary,
  },

  navBtn: {
    width: 58,
    borderRadius: 16,
    backgroundColor: palette.black,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  emptyTitle: {
    marginTop: spacing.md,
  },

  emptySub: {
    textAlign: "center",
    marginTop: spacing.sm,
    color: palette.stone,
  },
});