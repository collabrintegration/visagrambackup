import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function flagEmoji(code: string | undefined | null) {
  if (!code || code.length < 2) return "🏳";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

interface PassportRankEntry {
  passportCode: string;
  passportCountry: string;
  total: number;
  visaFree: number;
  visaOnArrival: number;
  eVisa: number;
  visaRequired: number;
}

interface PassportRankCardProps {
  entry: PassportRankEntry;
  rank: number;
  isSelected?: boolean;
}

export function PassportRankCard({ entry, rank, isSelected = false }: PassportRankCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
        isSelected && styles.selected,
      ]}
    >
      <View style={styles.rankBadge}>
        <Text style={[styles.rankText, { color: rank <= 3 ? "#E2A93C" : colors.mutedForeground }]}>
          #{rank}
        </Text>
      </View>
      <Text style={styles.flag}>{flagEmoji(entry.passportCode)}</Text>
      <View style={styles.info}>
        <Text style={[styles.country, { color: colors.foreground }]} numberOfLines={1}>
          {entry.passportCountry}
        </Text>
        <Text style={[styles.total, { color: colors.mutedForeground }]}>
          {entry.total} destinations
        </Text>
      </View>
      <View style={styles.bars}>
        <Dot count={entry.visaFree} color="#4ADE80" />
        <Dot count={entry.visaOnArrival} color="#FACC15" />
        <Dot count={entry.eVisa} color="#60A5FA" />
      </View>
    </View>
  );
}

function Dot({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return (
    <View style={[styles.dot, { backgroundColor: color }]}>
      <Text style={styles.dotText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    gap: 10,
  },
  selected: {
    borderWidth: 2,
  },
  rankBadge: {
    width: 32,
    alignItems: "center",
  },
  rankText: {
    fontSize: 13,
    fontWeight: "700",
  },
  flag: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  country: {
    fontSize: 14,
    fontWeight: "600",
  },
  total: {
    fontSize: 12,
    marginTop: 2,
  },
  bars: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dotText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#09090D",
  },
});
