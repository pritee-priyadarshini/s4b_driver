import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Pickup } from "../types/domain";
import { colors, PrimaryButton, StatusPill } from "./ui";

export function PickupCard({
  pickup,
  onOpen,
  compact
}: {
  pickup: Pickup;
  onOpen: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
    >
      <View style={styles.header}>
        <View>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{pickup.code}</Text>
            {pickup.priority === "urgent" ? (
              <View style={styles.urgent}>
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.restaurant}>{pickup.restaurant.name}</Text>
        </View>
        <StatusPill status={pickup.status} compact />
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routeRail}>
          <View style={styles.dot} />
          <View style={styles.railLine} />
          <View style={[styles.dot, styles.dropDot]} />
        </View>
        <View style={styles.routeText}>
          <Text style={styles.stopLabel}>Pickup</Text>
          <Text style={styles.address} numberOfLines={1}>
            {pickup.restaurant.address}
          </Text>
          <View style={styles.stopSpacer} />
          <Text style={styles.stopLabel}>Drop</Text>
          <Text style={styles.address} numberOfLines={1}>
            {pickup.charity.address}
          </Text>
        </View>
      </View>

      {!compact ? (
        <>
          <View style={styles.metaGrid}>
            <Meta icon="time-outline" label="Window" value={pickup.pickupWindow} />
            <Meta
              icon="fast-food-outline"
              label="Food"
              value={`${pickup.servings} servings`}
            />
            <Meta
              icon="navigate-outline"
              label="Route"
              value={`${pickup.distanceKm.toFixed(1)} km`}
            />
          </View>
          <PrimaryButton
            label={pickup.status === "delivered" ? "View receipt" : "Open route"}
            icon="map-outline"
            onPress={onOpen}
            variant={pickup.status === "delivered" ? "ghost" : "secondary"}
          />
        </>
      ) : null}
    </Pressable>
  );
}

function Meta({
  icon,
  label,
  value
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={16} color={colors.brandDark} />
      <View>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  code: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0
  },
  urgent: {
    backgroundColor: colors.redSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  urgentText: {
    color: colors.red,
    fontSize: 11,
    fontWeight: "900"
  },
  restaurant: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    maxWidth: 210
  },
  routeRow: {
    flexDirection: "row",
    marginTop: 16
  },
  routeRail: {
    width: 22,
    alignItems: "center",
    paddingTop: 4
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand
  },
  dropDot: {
    backgroundColor: colors.blue
  },
  railLine: {
    width: 2,
    height: 38,
    backgroundColor: colors.line
  },
  routeText: {
    flex: 1
  },
  stopLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  address: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2
  },
  stopSpacer: {
    height: 17
  },
  metaGrid: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 16
  },
  meta: {
    flex: 1,
    minHeight: 66,
    borderRadius: 8,
    padding: 9,
    backgroundColor: colors.inkSoft,
    justifyContent: "space-between"
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  metaValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  }
});
