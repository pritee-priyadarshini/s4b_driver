import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
import { PickupStatus } from "../types/domain";

export const colors = {
  background: "#F6F8F4",
  surface: "#FFFFFF",
  text: "#18201B",
  muted: "#6B766F",
  line: "#DDE5DC",
  brand: "#1E7F4F",
  brandDark: "#125A38",
  amber: "#B7791F",
  amberSoft: "#FFF3D7",
  blue: "#2563EB",
  blueSoft: "#EAF1FF",
  greenSoft: "#E8F7EE",
  red: "#B42318",
  redSoft: "#FEE7E4",
  inkSoft: "#EDF1ED"
};

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  variant = "primary",
  style
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.primaryButton,
        variant === "secondary" && styles.secondaryButton,
        variant === "ghost" && styles.ghostButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          color={variant === "primary" ? "#FFFFFF" : colors.brandDark}
          size={18}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          variant !== "primary" && styles.secondaryButtonText
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Metric({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "blue" | "amber";
}) {
  return (
    <View
      style={[
        styles.metric,
        tone === "green" && { backgroundColor: colors.greenSoft },
        tone === "blue" && { backgroundColor: colors.blueSoft },
        tone === "amber" && { backgroundColor: colors.amberSoft }
      ]}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function StatusPill({
  status,
  compact
}: {
  status: PickupStatus | "available" | "live";
  compact?: boolean;
}) {
  const config = {
    assigned: ["Assigned", colors.blueSoft, colors.blue],
    "heading-to-restaurant": ["To pickup", colors.amberSoft, colors.amber],
    "picked-up": ["Picked up", colors.greenSoft, colors.brand],
    delivered: ["Delivered", colors.inkSoft, colors.muted],
    available: ["Available", colors.greenSoft, colors.brand],
    live: ["Live", colors.redSoft, colors.red]
  }[status];

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: config[1] },
        compact && styles.compactPill
      ]}
    >
      <Text style={[styles.pillText, { color: config[2] }]}>{config[0]}</Text>
    </View>
  );
}

export function SectionTitle({
  title,
  action
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={24} color={colors.brandDark} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 8,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    backgroundColor: colors.brand
  },
  secondaryButton: {
    backgroundColor: colors.greenSoft,
    borderColor: "#BFE5CB",
    borderWidth: 1
  },
  ghostButton: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800"
  },
  secondaryButtonText: {
    color: colors.brandDark
  },
  metric: {
    flex: 1,
    minHeight: 82,
    borderRadius: 8,
    padding: 12,
    justifyContent: "space-between",
    backgroundColor: colors.inkSoft
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  pill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  compactPill: {
    minHeight: 24,
    paddingHorizontal: 9
  },
  pillText: {
    fontSize: 12,
    fontWeight: "900"
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitleText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  sectionAction: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800"
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center"
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6
  }
});
