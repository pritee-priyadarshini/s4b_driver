import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pickup } from "../types/domain";
import { colors, StatusPill } from "./ui";

const pointPositions: Array<{ left: `${number}%`; top: `${number}%` }> = [
  { left: "13%", top: "68%" },
  { left: "34%", top: "37%" },
  { left: "58%", top: "46%" },
  { left: "81%", top: "24%" }
];

export function RouteMap({
  pickup,
  progress,
  live
}: {
  pickup: Pickup;
  progress: number;
  live: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const driverLeft = 13 + clamped * 68;
  const driverTop = 68 - Math.sin(clamped * Math.PI) * 28 - clamped * 44;

  return (
    <View style={styles.map}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Live route</Text>
        {live ? <StatusPill status="live" compact /> : null}
      </View>
      <View style={styles.gridA} />
      <View style={styles.gridB} />
      <View style={styles.roadOne} />
      <View style={styles.roadTwo} />
      <View style={styles.roadThree} />
      <View style={styles.routeLine} />
      <View style={[styles.routeLine, styles.routeLineTwo]} />
      <View style={[styles.routeLine, styles.routeLineThree]} />

      {pickup.route.slice(0, 4).map((point, index) => {
        const position = pointPositions[index] ?? pointPositions[3];
        const isPickup = index === 1;
        const isDrop = index === pickup.route.slice(0, 4).length - 1;
        return (
          <View
            key={`${point.label}-${index}`}
            style={[styles.mapPoint, position, isDrop && styles.dropPoint]}
          >
            <Ionicons
              name={isPickup ? "storefront" : isDrop ? "home" : "ellipse"}
              size={isPickup || isDrop ? 14 : 8}
              color="#FFFFFF"
            />
          </View>
        );
      })}

      <View
        style={[
          styles.driverPin,
          {
            left: `${driverLeft}%`,
            top: `${driverTop}%`
          }
        ]}
      >
        <Ionicons name="bicycle" size={17} color="#FFFFFF" />
      </View>

      <View style={styles.mapFooter}>
        <View>
          <Text style={styles.footerLabel}>Next stop</Text>
          <Text style={styles.footerValue}>
            {clamped < 0.45
              ? pickup.restaurant.name
              : clamped < 0.9
                ? pickup.charity.name
                : "Arrival confirmation"}
          </Text>
        </View>
        <View style={styles.footerBadge}>
          <Text style={styles.footerBadgeText}>
            {Math.max(1, Math.round(pickup.etaMinutes * (1 - clamped)))} min
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 320,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#DCECDC",
    borderWidth: 1,
    borderColor: "#C7D8C8",
    position: "relative"
  },
  mapHeader: {
    position: "absolute",
    zIndex: 20,
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  mapTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  gridA: {
    position: "absolute",
    width: 280,
    height: 120,
    left: -20,
    top: 42,
    backgroundColor: "#CFE4D0",
    transform: [{ rotate: "-16deg" }]
  },
  gridB: {
    position: "absolute",
    width: 240,
    height: 160,
    right: -36,
    bottom: 36,
    backgroundColor: "#E6F1E0",
    transform: [{ rotate: "22deg" }]
  },
  roadOne: {
    position: "absolute",
    width: 390,
    height: 34,
    top: 166,
    left: -42,
    backgroundColor: "#F7FAF5",
    transform: [{ rotate: "-24deg" }]
  },
  roadTwo: {
    position: "absolute",
    width: 390,
    height: 28,
    top: 118,
    left: 20,
    backgroundColor: "#F7FAF5",
    transform: [{ rotate: "18deg" }]
  },
  roadThree: {
    position: "absolute",
    width: 34,
    height: 360,
    top: -10,
    left: 150,
    backgroundColor: "#F7FAF5",
    transform: [{ rotate: "8deg" }]
  },
  routeLine: {
    position: "absolute",
    height: 7,
    width: 118,
    left: "15%",
    top: "58%",
    backgroundColor: colors.brand,
    borderRadius: 999,
    transform: [{ rotate: "-48deg" }]
  },
  routeLineTwo: {
    width: 104,
    left: "37%",
    top: "42%",
    transform: [{ rotate: "17deg" }]
  },
  routeLineThree: {
    width: 124,
    left: "57%",
    top: "35%",
    transform: [{ rotate: "-32deg" }]
  },
  mapPoint: {
    position: "absolute",
    zIndex: 15,
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF"
  },
  dropPoint: {
    backgroundColor: colors.blue
  },
  driverPin: {
    position: "absolute",
    zIndex: 18,
    width: 38,
    height: 38,
    marginLeft: -19,
    marginTop: -19,
    borderRadius: 19,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF"
  },
  mapFooter: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    minHeight: 64,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  footerLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  footerValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
    maxWidth: 210
  },
  footerBadge: {
    backgroundColor: colors.greenSoft,
    minWidth: 60,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  footerBadgeText: {
    color: colors.brandDark,
    fontWeight: "900"
  }
});
