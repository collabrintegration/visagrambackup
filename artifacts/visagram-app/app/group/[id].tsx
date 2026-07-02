import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetGroup,
  useListGroupMessages,
  useListGroupMembers,
  useJoinGroup,
  useCreateGroupMessage,
} from "@workspace/api-client-react";
import type { GroupMessage, GroupMember } from "@workspace/api-client-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(first?: string | null, last?: string | null) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

function Avatar({ first, last, size = 34 }: { first?: string | null; last?: string | null; size?: number }) {
  const colors = useColors();
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
    ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38, color: colors.primaryForeground }]}>
        {initials(first, last)}
      </Text>
    </View>
  );
}

function MessageBubble({ msg, isMe }: { msg: GroupMessage; isMe: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
      {!isMe && <Avatar first={msg.firstName} last={msg.lastName} size={30} />}
      <View style={{ maxWidth: "75%", gap: 3 }}>
        {!isMe && (
          <Text style={[styles.msgSender, { color: colors.mutedForeground }]}>
            {[msg.firstName, msg.lastName].filter(Boolean).join(" ") || "Traveler"}
          </Text>
        )}
        <View style={[
          styles.bubble,
          isMe
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
        ]}>
          <Text style={[styles.bubbleText, { color: isMe ? colors.primaryForeground : colors.foreground }]}>
            {msg.content}
          </Text>
        </View>
        <Text style={[styles.msgTime, { color: colors.mutedForeground }, isMe && { textAlign: "right" }]}>
          {timeAgo(msg.createdAt)}
        </Text>
      </View>
      {isMe && <Avatar first={msg.firstName} last={msg.lastName} size={30} />}
    </View>
  );
}

function MemberRow({ member }: { member: GroupMember }) {
  const colors = useColors();
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "Traveler";
  return (
    <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
      <Avatar first={member.firstName} last={member.lastName} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.memberName, { color: colors.foreground }]}>{name}</Text>
        <Text style={[styles.memberRole, { color: colors.mutedForeground }]}>
          {member.role === "admin" ? "Admin" : "Member"}
        </Text>
      </View>
      {member.role === "admin" && (
        <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.adminBadgeText, { color: colors.primaryForeground }]}>Admin</Text>
        </View>
      )}
    </View>
  );
}

type Tab = "chat" | "members";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("chat");
  const [message, setMessage] = useState("");
  const flatRef = useRef<FlatList>(null);

  const { data: group, isLoading: groupLoading, refetch: refetchGroup } = useGetGroup(groupId);
  const { data: messages, isLoading: msgsLoading, refetch: refetchMsgs } = useListGroupMessages(groupId);
  const { data: members, isLoading: membersLoading } = useListGroupMembers(groupId);

  const joinMutation = useJoinGroup({
    mutation: {
      onSuccess: () => refetchGroup(),
    },
  });

  const sendMutation = useCreateGroupMessage({
    mutation: {
      onSuccess: () => {
        setMessage("");
        refetchMsgs();
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
      },
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate({ id: groupId, data: { content: trimmed } });
  };

  const handleJoin = () => {
    joinMutation.mutate({ id: groupId });
  };

  if (groupLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Group not found.</Text>
      </View>
    );
  }

  const isMember = group.isMember;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={[styles.groupEmojiBox, { backgroundColor: colors.secondary }]}>
          <Text style={styles.groupEmoji}>{group.emoji || "🌍"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>
            {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
            {group.isPrivate ? " · Private" : " · Public"}
          </Text>
        </View>
        {!isMember && (
          <Pressable
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            onPress={handleJoin}
            disabled={joinMutation.isPending}
          >
            <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>
              {joinMutation.isPending ? "Joining…" : group.isPrivate ? "Request" : "Join"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(["chat", "members"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabLabel, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "chat" ? "Chat" : "Members"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chat tab */}
      {tab === "chat" && (
        <>
          {msgsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages ?? []}
              keyExtractor={(m) => String(m.id)}
              renderItem={({ item }) => (
                <MessageBubble msg={item} isMe={!!user && item.userId === user.id} />
              )}
              contentContainerStyle={[styles.chatList, { paddingBottom: 12 }]}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Feather name="message-circle" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {isMember ? "No messages yet. Say hello!" : "Join to see the chat."}
                  </Text>
                </View>
              }
            />
          )}
          {isMember && user && (
            <View style={[
              styles.inputBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + (Platform.OS === "web" ? 0 : 8),
              },
            ]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Message…"
                placeholderTextColor={colors.mutedForeground}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
                onSubmitEditing={handleSend}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  { backgroundColor: message.trim() ? colors.primary : colors.secondary },
                ]}
                onPress={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                <Feather
                  name="send"
                  size={18}
                  color={message.trim() ? colors.primaryForeground : colors.mutedForeground}
                />
              </Pressable>
            </View>
          )}
          {!isMember && (
            <View style={[styles.joinBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Text style={[styles.joinBannerText, { color: colors.mutedForeground }]}>
                Join this group to send messages
              </Text>
              <Pressable
                style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                onPress={handleJoin}
                disabled={joinMutation.isPending}
              >
                <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>
                  {joinMutation.isPending ? "Joining…" : group.isPrivate ? "Request to Join" : "Join Group"}
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Members tab */}
      {tab === "members" && (
        membersLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={members ?? []}
            keyExtractor={(m) => m.userId}
            renderItem={({ item }) => <MemberRow member={item} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No members yet.</Text>
              </View>
            }
          />
        )
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 4 },
  groupEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  groupEmoji: { fontSize: 22 },
  groupName: { fontSize: 16, fontWeight: "700" },
  groupMeta: { fontSize: 12, marginTop: 1 },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  joinBtnText: { fontSize: 13, fontWeight: "600" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 60,
  },
  emptyText: { fontSize: 14 },
  chatList: { paddingHorizontal: 14, paddingTop: 12, gap: 12 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  msgRowMe: { flexDirection: "row-reverse" },
  avatar: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontWeight: "700" },
  msgSender: { fontSize: 11, marginBottom: 2, marginLeft: 4 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  msgTime: { fontSize: 10, marginTop: 2, marginHorizontal: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBanner: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  joinBannerText: { fontSize: 14 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  memberName: { fontSize: 15, fontWeight: "600" },
  memberRole: { fontSize: 12, marginTop: 2 },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adminBadgeText: { fontSize: 11, fontWeight: "600" },
  errorText: { fontSize: 15, textAlign: "center", marginTop: 80 },
});
