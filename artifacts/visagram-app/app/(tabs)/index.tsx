import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CountryCard } from "@/components/CountryCard";
import { useColors } from "@/hooks/useColors";
import { useListCountries } from "@workspace/api-client-react";

const CONTINENTS = ["All", "Europe", "Asia", "Americas", "Africa", "Oceania", "Middle East"];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("All");
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: countries, isLoading, refetch } = useListCountries({
    search: search || undefined,
    continent: continent === "All" ? undefined : continent,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.logo, { color: colors.foreground }]}>visagram</Text>
        <Text style={[styles.logoAccent, { color: colors.primary }]}>.</Text>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search countries..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScrollView}
        contentContainerStyle={styles.continentScroll}
      >
        {CONTINENTS.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.chip,
              {
                backgroundColor: continent === c ? colors.primary : colors.secondary,
                borderColor: continent === c ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setContinent(c)}
          >
            <Text
              style={[
                styles.chipText,
                { color: continent === c ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={countries ?? []}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <CountryCard
              country={item}
              onPress={() => router.push(`/country/${item.code}`)}
            />
          )}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="globe" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No countries found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  logoAccent: {
    fontSize: 28,
    fontWeight: "900",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  chipScrollView: {
    flexShrink: 0,
    flexGrow: 0,
    marginBottom: 6,
  },
  continentScroll: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 2,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    paddingTop: 6,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
});
