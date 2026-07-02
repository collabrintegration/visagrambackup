import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedCard } from "@/components/FeedCard";
import { useColors } from "@/hooks/useColors";
import { useGetCommunityFeed } from "@workspace/api-client-react";

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: feed, isLoading, refetch, isRefetching } = useGetCommunityFeed({ limit: 50 });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Reviews & questions from travelers
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={(feed ?? []) as Array<{
            id: number;
            type: string;
            data: Record<string, unknown>;
            countryCode?: string;
            countryName?: string;
            userName?: string;
            createdAt: string;
          }>}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <FeedCard item={item} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No community activity yet
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingTop: 4,
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
