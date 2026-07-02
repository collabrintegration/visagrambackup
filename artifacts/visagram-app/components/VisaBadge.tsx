import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VisaBadgeProps {
  entryType: string;
  compact?: boolean;
}

const ENTRY_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  visa_free: { label: "Visa Free", bg: "#1A3A2A", fg: "#4ADE80" },
  visa_on_arrival: { label: "On Arrival", bg: "#2A2A1A", fg: "#FACC15" },
  evisa: { label: "eVisa", bg: "#1A2A3A", fg: "#60A5FA" },
  visa_required: { label: "Required", bg: "#3A1A1A", fg: "#F87171" },
};

export function VisaBadge({ entryType, compact = false }: VisaBadgeProps) {
  const config = ENTRY_CONFIG[entryType] ?? { label: entryType, bg: "#26262D", fg: "#BCBCC3" };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, compact && styles.compact]}>
      <Text style={[styles.text, { color: config.fg }, compact && styles.compactText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  compactText: {
    fontSize: 11,
  },
});
