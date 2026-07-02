import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListGroups } from "@workspace/api-client-react";
import type { Group } from "@workspace/api-client-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function GroupCard({ group }: { group: Group }) {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => router.push(`/group/${group.id}`)}
    >
      <View style={[styles.emojiBox, { backgroundColor: colors.secondary }]}>
        <Text style={styles.emoji}>{group.emoji || "🌍"}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          {group.isPrivate && (
            <View style={[styles.privateBadge, { backgroundColor: colors.muted }]}>
              <Feather name="lock" size={10} color={colors.mutedForeground} />
            </View>
          )}
        </View>

        {group.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
            </Text>
          </View>

          {group.lastMessage ? (
            <Text style={[styles.lastMsg, { color: colors.mutedForeground }]}>
              {timeAgo(group.lastMessage.createdAt)}
            </Text>
          ) : null}
        </View>

        {group.lastMessage ? (
          <Text style={[styles.lastMsgPreview, { color: colors.cardForeground }]} numberOfLines={1}>
            {group.lastMessage.content}
          </Text>
        ) : null}
      </View>

      {group.isMember && (
        <View style={[styles.memberDot, { backgroundColor: colors.primary }]} />
      )}
    </Pressable>
  );
}

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: groups, isLoading, refetch, isRefetching } = useListGroups();

  const filtered = (groups ?? []).filter((g) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Groups</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Travel communities & group chats
        </Text>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search groups..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <GroupCard group={item} />}
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
                {search ? "No groups match your search" : "No groups yet"}
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
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 3 },
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
  searchInput: { flex: 1, fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 12,
  },
  emojiBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emoji: { fontSize: 24 },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  groupName: { fontSize: 15, fontWeight: "700", flex: 1 },
  privateBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  description: { fontSize: 13, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  lastMsg: { fontSize: 11 },
  lastMsgPreview: { fontSize: 12, fontStyle: "italic" },
  memberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    flexShrink: 0,
  },
});
