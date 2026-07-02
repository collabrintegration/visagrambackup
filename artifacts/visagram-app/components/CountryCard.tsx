import { Feather } from "@expo/vector-icons";
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
      <Text style={styles.flag}>{country.flagEmoji || country.flag || flagEmoji(country.code)}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {country.name}
        </Text>
        <Text style={[styles.continent, { color: colors.mutedForeground }]}>
          {country.continent ?? ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  flag: {
    fontSize: 30,
    width: 42,
    textAlign: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  continent: {
    fontSize: 12,
    marginTop: 2,
  },
});
