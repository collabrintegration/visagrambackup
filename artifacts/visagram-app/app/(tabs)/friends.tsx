import { Feather } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListFriends,
  useListFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
  getListFriendsQueryKey,
  getListFriendRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "friends" | "requests" | "search";

function Avatar({
  url,
  name,
  size = 48,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
}) {
  const colors = useColors();
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary + "33",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={{ color: colors.primary, fontSize: size * 0.35, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

function FriendCard({
  id,
  firstName,
  lastName,
  profileImageUrl,
  homeCountry,
  onUnfriend,
}: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  homeCountry?: string | null;
  onUnfriend: (id: string) => void;
}) {
  const colors = useColors();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Traveler";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar url={profileImageUrl} name={name} />
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.foreground }]}>{name}</Text>
        {homeCountry ? (
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            📍 {homeCountry}
          </Text>
        ) : null}
      </View>
      <Pressable
        style={[styles.actionBtn, { borderColor: colors.border }]}
        onPress={() => onUnfriend(id)}
      >
        <Feather name="user-minus" size={14} color={colors.mutedForeground} />
        <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Remove</Text>
      </Pressable>
    </View>
  );
}

function RequestCard({
  id,
  firstName,
  lastName,
  profileImageUrl,
  homeCountry,
  onAccept,
  onDecline,
}: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  homeCountry?: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const colors = useColors();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Traveler";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar url={profileImageUrl} name={name} />
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.foreground }]}>{name}</Text>
        {homeCountry ? (
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            📍 {homeCountry}
          </Text>
        ) : null}
      </View>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          onPress={() => onAccept(id)}
        >
          <Text style={styles.acceptBtnText}>Accept</Text>
        </Pressable>
        <Pressable
          style={[styles.declineBtn, { borderColor: colors.border }]}
          onPress={() => onDecline(id)}
        >
          <Text style={[styles.declineBtnText, { color: colors.mutedForeground }]}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

type FriendshipStatus = "pending" | "accepted" | null;

function SearchResultCard({
  id,
  firstName,
  lastName,
  profileImageUrl,
  homeCountry,
  friendshipStatus,
  iRequested,
  onAdd,
}: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  homeCountry?: string | null;
  friendshipStatus?: string | null;
  iRequested?: boolean | null;
  onAdd: (id: string) => void;
}) {
  const colors = useColors();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Traveler";

  let btnLabel = "Add Friend";
  let btnIcon: "user-plus" | "clock" | "user-check" = "user-plus";
  let btnDisabled = false;
  if (friendshipStatus === "accepted") {
    btnLabel = "Friends";
    btnIcon = "user-check";
    btnDisabled = true;
  } else if (friendshipStatus === "pending" && iRequested) {
    btnLabel = "Requested";
    btnIcon = "clock";
    btnDisabled = true;
  } else if (friendshipStatus === "pending" && !iRequested) {
    btnLabel = "Accept";
    btnIcon = "user-check";
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar url={profileImageUrl} name={name} />
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.foreground }]}>{name}</Text>
        {homeCountry ? (
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            📍 {homeCountry}
          </Text>
        ) : null}
      </View>
      <Pressable
        style={[
          styles.addBtn,
          {
            backgroundColor: btnDisabled ? colors.secondary : colors.primary,
            opacity: btnDisabled ? 0.7 : 1,
          },
        ]}
        onPress={() => !btnDisabled && onAdd(id)}
        disabled={btnDisabled}
      >
        <Feather name={btnIcon} size={13} color="#fff" />
        <Text style={styles.addBtnText}>{btnLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends = [], isLoading: loadingFriends, refetch: refetchFriends } = useListFriends({
    query: { enabled: !!user },
  });
  const { data: requests = [], isLoading: loadingRequests, refetch: refetchRequests } = useListFriendRequests({
    query: { enabled: !!user },
  });
  const { data: searchResults = [], isLoading: loadingSearch } = useSearchUsers(
    { q: searchQuery },
    { query: { enabled: !!user && searchQuery.trim().length >= 2 } },
  );

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const removeFriend = useRemoveFriend();

  const invalidateFriends = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListFriendRequestsQueryKey() });
  }, [queryClient]);

  const handleAdd = useCallback(
    (userId: string) => {
      sendRequest.mutate({ userId }, { onSuccess: () => invalidateFriends() });
    },
    [sendRequest, invalidateFriends],
  );

  const handleAccept = useCallback(
    (requesterId: string) => {
      acceptRequest.mutate({ requesterId }, { onSuccess: () => invalidateFriends() });
    },
    [acceptRequest, invalidateFriends],
  );

  const handleDecline = useCallback(
    (requesterId: string) => {
      declineRequest.mutate({ requesterId }, { onSuccess: () => invalidateFriends() });
    },
    [declineRequest, invalidateFriends],
  );

  const handleUnfriend = useCallback(
    (userId: string) => {
      removeFriend.mutate({ userId }, { onSuccess: () => invalidateFriends() });
    },
    [removeFriend, invalidateFriends],
  );

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="users" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to see friends</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Create an account to connect with travelers
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Friends</Text>
        <Pressable
          style={styles.headerSearch}
          onPress={() => setActiveTab("search")}
        >
          <Feather name="user-plus" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(["friends", "requests", "search"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(t)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t === "friends"
                ? `Friends${friends.length ? ` (${friends.length})` : ""}`
                : t === "requests"
                ? `Requests${requests.length ? ` (${requests.length})` : ""}`
                : "Find People"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search bar (shown on search tab) */}
      {activeTab === "search" && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      )}

      {/* Content */}
      {activeTab === "friends" && (
        <FlatList
          data={friends}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={loadingFriends} onRefresh={refetchFriends} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <FriendCard
              id={item.id}
              firstName={item.firstName}
              lastName={item.lastName}
              profileImageUrl={item.profileImageUrl}
              homeCountry={item.homeCountry}
              onUnfriend={handleUnfriend}
            />
          )}
          ListEmptyComponent={
            loadingFriends ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Feather name="users" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No friends yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Search for travelers and send friend requests
                </Text>
              </View>
            )
          }
        />
      )}

      {activeTab === "requests" && (
        <FlatList
          data={requests}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={loadingRequests} onRefresh={refetchRequests} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <RequestCard
              id={item.id}
              firstName={item.firstName}
              lastName={item.lastName}
              profileImageUrl={item.profileImageUrl}
              homeCountry={item.homeCountry}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}
          ListEmptyComponent={
            loadingRequests ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Feather name="inbox" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No pending requests</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Friend requests from other travelers will appear here
                </Text>
              </View>
            )
          }
        />
      )}

      {activeTab === "search" && (
        <FlatList
          data={searchResults}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => (
            <SearchResultCard
              id={item.id}
              firstName={item.firstName}
              lastName={item.lastName}
              profileImageUrl={item.profileImageUrl}
              homeCountry={item.homeCountry}
              friendshipStatus={item.friendshipStatus}
              iRequested={item.iRequested}
              onAdd={handleAdd}
            />
          )}
          ListEmptyComponent={
            searchQuery.trim().length < 2 ? (
              <View style={styles.empty}>
                <Feather name="search" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Find travelers</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Type at least 2 characters to search
                </Text>
              </View>
            ) : loadingSearch ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Try searching by first name, last name, or email
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  headerSearch: { padding: 4 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 14, fontWeight: "600" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 12, marginTop: 2 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: "500" },
  requestActions: { gap: 6 },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  declineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  declineBtnText: { fontSize: 13, fontWeight: "500" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", gap: 8, marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
