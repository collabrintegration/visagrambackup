import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMyActivity, useGetTravelMap } from "@workspace/api-client-react";

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function ActivityItem({ item }: { item: Record<string, unknown> }) {
  const colors = useColors();
  const type = typeof item["type"] === "string" ? item["type"] : "activity";
  const countryName = typeof item["countryName"] === "string" ? item["countryName"] : "";
  const createdAt = typeof item["createdAt"] === "string" ? item["createdAt"] : "";

  const isReview = type === "review";
  const diff = createdAt ? Date.now() - new Date(createdAt).getTime() : 0;
  const days = Math.floor(diff / 86400000);
  const timeStr = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;

  return (
    <View style={[styles.actItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.actIcon, { backgroundColor: isReview ? "#1A2A1A" : "#1A1A2A" }]}>
        <Feather
          name={isReview ? "star" : "help-circle"}
          size={14}
          color={isReview ? "#4ADE80" : "#60A5FA"}
        />
      </View>
      <View style={styles.actInfo}>
        <Text style={[styles.actType, { color: colors.foreground }]}>
          {isReview ? "Reviewed" : "Asked"} in {countryName}
        </Text>
        <Text style={[styles.actTime, { color: colors.mutedForeground }]}>{timeStr}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 100);

  const { data: travelMap } = useGetTravelMap({ query: { enabled: !!user } });
  const { data: activity } = useGetMyActivity({ query: { enabled: !!user } });

  const visited = (travelMap ?? []).filter(
    (e) => typeof e === "object" && e !== null && (e as Record<string, unknown>)["status"] === "visited"
  ).length;
  const wantToVisit = (travelMap ?? []).filter(
    (e) => typeof e === "object" && e !== null && (e as Record<string, unknown>)["status"] === "want_to_visit"
  ).length;

  const openWeb = async () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "visagram.io";
    await WebBrowser.openBrowserAsync(`https://${domain}/profile`);
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.center, { paddingTop: topPad }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        </View>
        <View style={styles.signInContainer}>
          <View style={[styles.signInIcon, { backgroundColor: colors.card }]}>
            <Feather name="user" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.signInTitle, { color: colors.foreground }]}>
            Join the community
          </Text>
          <Text style={[styles.signInSub, { color: colors.mutedForeground }]}>
            Sign in to track your travels, write reviews, and ask questions
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.signInBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={openWeb}
          >
            <Feather name="log-in" size={18} color="#FFFFFF" />
            <Text style={styles.signInBtnText}>Sign in with Replit</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user.name[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
          <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>Traveler</Text>
        </View>
        <Pressable onPress={openWeb}>
          <Feather name="external-link" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Visited" value={visited} color="#4ADE80" />
        <StatCard label="Wishlist" value={wantToVisit} color="#60A5FA" />
        <StatCard label="Reviews" value={(activity ?? []).filter((a) => (a as Record<string, unknown>)["type"] === "review").length} color={colors.primary} />
      </View>

      {(activity ?? []).length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
          {(activity as Array<Record<string, unknown>>).slice(0, 10).map((item, i) => (
            <ActivityItem key={i} item={item} />
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.openWebBtn,
          { borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
        onPress={openWeb}
      >
        <Feather name="globe" size={16} color={colors.mutedForeground} />
        <Text style={[styles.openWebText, { color: colors.mutedForeground }]}>
          Open full profile on visagram.io
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  signInContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 16,
  },
  signInIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  signInTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  signInSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  signInBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileSub: { fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 3 },
  section: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", padding: 16, paddingBottom: 12 },
  actItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  actIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actInfo: { flex: 1 },
  actType: { fontSize: 13, fontWeight: "500" },
  actTime: { fontSize: 11, marginTop: 2 },
  openWebBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  openWebText: { fontSize: 13 },
});
