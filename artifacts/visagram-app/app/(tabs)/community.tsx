import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { FeedCard } from "@/components/FeedCard";
import {
  useListGroups,
  useGetCommunityFeed,
  useListFriends,
} from "@workspace/api-client-react";
import type { Group } from "@workspace/api-client-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.secondary : "transparent" },
      ]}
      onPress={onPress}
    >
      <View style={[styles.groupEmoji, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.groupEmojiText}>
          {group.isPrivate ? "🔒" : "🌐"}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          {group.createdAt && (
            <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
              {timeAgo(group.createdAt)}
            </Text>
          )}
        </View>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {group.description ?? "Tap to join and chat"}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground + "99" }]}>
          {group.memberCount ?? 0} members
        </Text>
      </View>
      {/* unread badge placeholder */}
    </Pressable>
  );
}

function InitialsAvatar({ name, size = 50 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <LinearGradient
      colors={["#7c3aed", "#db2777"]}
      style={[styles.initialsGradient, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initialsText, { fontSize: size * 0.32 }]}>{initials}</Text>
    </LinearGradient>
  );
}

function StoryRing({ flag, name }: { flag?: string; name: string }) {
  const colors = useColors();
  return (
    <View style={styles.storyItem}>
      <LinearGradient colors={["#7c3aed", "#db2777"]} style={styles.storyRing}>
        <View style={[styles.storyInner, { backgroundColor: colors.card }]}>
          <Text style={styles.storyFlag}>{flag ?? "✈️"}</Text>
        </View>
      </LinearGradient>
      <Text style={[styles.storyName, { color: colors.mutedForeground }]} numberOfLines={1}>
        {name.split(" ")[0]}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type MainTab = "chats" | "community";
type ChatsSubTab = "groups" | "dms";

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [mainTab, setMainTab] = useState<MainTab>("chats");
  const [subTab, setSubTab] = useState<ChatsSubTab>("groups");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: groups = [], isLoading: loadingGroups, refetch: refetchGroups } = useListGroups(
    { limit: 50 },
    { query: {} },
  );
  const { data: feed, isLoading: loadingFeed, refetch: refetchFeed } = useGetCommunityFeed({ limit: 30 });
  const { data: friends = [] } = useListFriends({ query: { enabled: !!user } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={[styles.logoText, { color: colors.foreground }]}>
            visa<Text style={{ color: "#db2777" }}>gram</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bell" size={18} color="#c4b5fd" />
            <View style={styles.notifDot} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={18} color="#c4b5fd" />
          </Pressable>
        </View>
      </View>

      {/* ── Main tab toggle ── */}
      <View style={styles.mainTabRow}>
        <Pressable
          style={({ pressed }) => [styles.mainTabBtn, pressed && { opacity: 0.85 }]}
          onPress={() => setMainTab("chats")}
        >
          {mainTab === "chats" ? (
            <LinearGradient colors={["#7c3aed", "#db2777"]} style={styles.mainTabActive}>
              <Text style={styles.mainTabActiveText}>💬  Chats</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.mainTabInactive, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.mainTabInactiveText, { color: colors.mutedForeground }]}>💬  Chats</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.mainTabBtn, pressed && { opacity: 0.85 }]}
          onPress={() => setMainTab("community")}
        >
          {mainTab === "community" ? (
            <LinearGradient colors={["#7c3aed", "#db2777"]} style={styles.mainTabActive}>
              <Text style={styles.mainTabActiveText}>🌍  Community</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.mainTabInactive, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.mainTabInactiveText, { color: colors.mutedForeground }]}>🌍  Community</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── CHATS content ── */}
      {mainTab === "chats" && (
        <View style={{ flex: 1 }}>
          {/* Sub-tabs */}
          <View style={[styles.subTabRow, { borderBottomColor: colors.border }]}>
            <Pressable
              style={[styles.subTab, subTab === "groups" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setSubTab("groups")}
            >
              <Text style={[styles.subTabText, { color: subTab === "groups" ? "#a78bfa" : colors.mutedForeground }]}>
                Groups
              </Text>
            </Pressable>
            <Pressable
              style={[styles.subTab, subTab === "dms" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setSubTab("dms")}
            >
              <Text style={[styles.subTabText, { color: subTab === "dms" ? "#a78bfa" : colors.mutedForeground }]}>
                Direct Messages
              </Text>
            </Pressable>
          </View>

          {/* Groups list */}
          {subTab === "groups" && (
            <FlatList
              data={groups}
              keyExtractor={(g) => String(g.id)}
              refreshControl={
                <RefreshControl refreshing={loadingGroups} onRefresh={refetchGroups} tintColor={colors.primary} />
              }
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
              renderItem={({ item }) => (
                <GroupRow group={item} onPress={() => router.push(`/group/${item.id}`)} />
              )}
              ListHeaderComponent={
                <Pressable
                  style={[styles.newGroupBtn, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}
                  onPress={() => router.push("/group/create" as any)}
                >
                  <View style={[styles.newGroupIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name="plus" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.newGroupText, { color: colors.primary }]}>New Group</Text>
                </Pressable>
              }
              ListEmptyComponent={
                loadingGroups ? (
                  <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                ) : (
                  <View style={styles.empty}>
                    <Feather name="users" size={36} color={colors.mutedForeground} />
                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No groups yet</Text>
                    <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                      Join or create a travel group to start chatting
                    </Text>
                  </View>
                )
              }
            />
          )}

          {/* DMs list */}
          {subTab === "dms" && (
            <FlatList
              data={friends}
              keyExtractor={(f) => f.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
              renderItem={({ item }) => {
                const name = [item.firstName, item.lastName].filter(Boolean).join(" ") || "Traveler";
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      { backgroundColor: pressed ? colors.secondary : "transparent" },
                    ]}
                  >
                    <View style={styles.dmAvatarWrap}>
                      <InitialsAvatar name={name} size={50} />
                    </View>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTopLine}>
                        <Text style={[styles.rowName, { color: colors.foreground }]}>{name}</Text>
                        {item.homeCountry && (
                          <Text style={styles.dmFlag}>{item.homeCountry}</Text>
                        )}
                      </View>
                      <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                        Tap to start a conversation
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              ListHeaderComponent={
                <Pressable style={[styles.newGroupBtn, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}>
                  <View style={[styles.newGroupIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name="edit-2" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.newGroupText, { color: colors.primary }]}>New Message</Text>
                </Pressable>
              }
              ListEmptyComponent={
                !user ? (
                  <View style={styles.empty}>
                    <Feather name="message-circle" size={36} color={colors.mutedForeground} />
                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to DM friends</Text>
                    <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                      Add friends first to start direct messages
                    </Text>
                  </View>
                ) : (
                  <View style={styles.empty}>
                    <Feather name="message-circle" size={36} color={colors.mutedForeground} />
                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No messages yet</Text>
                    <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                      Add friends to start direct conversations
                    </Text>
                  </View>
                )
              }
            />
          )}
        </View>
      )}

      {/* ── COMMUNITY content ── */}
      {mainTab === "community" && (
        <FlatList
          data={
            (feed ?? []) as Array<{
              id: number;
              type: string;
              data: Record<string, unknown>;
              countryCode?: string;
              countryName?: string;
              userName?: string;
              createdAt: string;
            }>
          }
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={loadingFeed} onRefresh={() => void refetchFeed()} tintColor={colors.primary} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          ListHeaderComponent={
            <>
              {/* Stories / active friends row */}
              {friends.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.storiesScroll}
                  contentContainerStyle={styles.storiesContent}
                >
                  {friends.map((f) => (
                    <StoryRing
                      key={f.id}
                      flag={f.homeCountry ?? undefined}
                      name={[f.firstName, f.lastName].filter(Boolean).join(" ") || "Traveler"}
                    />
                  ))}
                </ScrollView>
              )}
              <View style={[styles.feedDivider, { backgroundColor: colors.border }]} />
            </>
          }
          renderItem={({ item }) => <FeedCard item={item} />}
          ListEmptyComponent={
            loadingFeed ? (
              <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
            ) : (
              <View style={styles.empty}>
                <Feather name="globe" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Be the first to share a visa tip or review!
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logoText: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#db2777",
  },

  mainTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  mainTabBtn: { flex: 1 },
  mainTabActive: {
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTabActiveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  mainTabInactive: {
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTabInactiveText: { fontSize: 14, fontWeight: "600" },

  subTabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  subTab: {
    paddingVertical: 10,
    paddingRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabText: { fontSize: 13, fontWeight: "600" },

  listContent: { paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 1,
  },
  groupEmoji: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  groupEmojiText: { fontSize: 26 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  rowName: { fontSize: 14, fontWeight: "600", flex: 1 },
  rowTime: { fontSize: 11, flexShrink: 0, marginLeft: 8 },
  rowSub: { fontSize: 12, marginBottom: 2 },
  rowMeta: { fontSize: 11 },

  dmAvatarWrap: {},
  dmFlag: { fontSize: 18 },

  initialsGradient: { alignItems: "center", justifyContent: "center" },
  initialsText: { color: "#fff", fontWeight: "700" },

  newGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 12,
    marginBottom: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  newGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  newGroupText: { fontSize: 14, fontWeight: "600" },

  storiesScroll: {},
  storiesContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  storyItem: { alignItems: "center", gap: 4, width: 60 },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 18,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  storyInner: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  storyFlag: { fontSize: 26 },
  storyName: { fontSize: 10, textAlign: "center" },

  feedDivider: { height: 1, marginHorizontal: 16, marginBottom: 8 },

  empty: { alignItems: "center", gap: 8, marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
