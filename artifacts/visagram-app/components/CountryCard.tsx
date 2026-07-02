import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function flagEmoji(code: string | undefined | null) {
  if (!code || code.length < 2) return "🏳";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

interface Country {
  code: string;
  name: string;
  continent?: string;
  flag?: string;
  flagEmoji?: string;
  visaFreeCount?: number;
}

interface CountryCardProps {
  country: Country;
  onPress: () => void;
}

export function CountryCard({ country, onPress }: CountryCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.flagBox, { backgroundColor: colors.secondary }]}>
        <Text style={styles.flag}>
          {country.flagEmoji || country.flag || flagEmoji(country.code)}
        </Text>
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
        {country.name}
      </Text>
      {country.continent ? (
        <Text style={[styles.continent, { color: colors.mutedForeground }]} numberOfLines={1}>
          {country.continent}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  flagBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: {
    fontSize: 36,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
  },
  continent: {
    fontSize: 11,
    textAlign: "center",
  },
});
