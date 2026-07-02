import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { StarRating } from "./StarRating";

function flagEmoji(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface FeedItem {
  id: number;
  type: string;
  data: Record<string, unknown>;
  countryCode?: string;
  countryName?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  createdAt: string;
}

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const colors = useColors();
  const router = useRouter();

  const isReview = item.type === "review";
  const rating = typeof item.data["rating"] === "number" ? item.data["rating"] : null;
  const content = typeof item.data["content"] === "string" ? item.data["content"] : null;
  const title = typeof item.data["title"] === "string" ? item.data["title"] : null;
  const body = typeof item.data["body"] === "string" ? item.data["body"] : null;

  const handlePress = () => {
    if (item.countryCode) {
      router.push(`/country/${item.countryCode}`);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(item.userName ?? "?")[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {item.userName ?? "Traveler"}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <View style={[styles.typePill, { backgroundColor: isReview ? "#1A2A1A" : "#1A1A2A" }]}>
          <Feather
            name={isReview ? "star" : "help-circle"}
            size={11}
            color={isReview ? "#4ADE80" : "#60A5FA"}
          />
          <Text style={[styles.typeText, { color: isReview ? "#4ADE80" : "#60A5FA" }]}>
            {isReview ? "Review" : "Question"}
          </Text>
        </View>
      </View>

      {item.countryCode && (
        <View style={styles.countryRow}>
          <Text style={styles.flagSmall}>{flagEmoji(item.countryCode)}</Text>
          <Text style={[styles.countryName, { color: colors.mutedForeground }]}>
            {item.countryName ?? item.countryCode}
          </Text>
        </View>
      )}

      {isReview && rating !== null && (
        <View style={styles.ratingRow}>
          <StarRating rating={rating} />
        </View>
      )}

      {isReview && content && (
        <Text style={[styles.content, { color: colors.cardForeground }]} numberOfLines={3}>
          {content}
        </Text>
      )}

      {!isReview && title && (
        <Text style={[styles.questionTitle, { color: colors.foreground }]} numberOfLines={2}>
          {title}
        </Text>
      )}
      {!isReview && body && (
        <Text style={[styles.content, { color: colors.cardForeground }]} numberOfLines={2}>
          {body}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 10,
  },
  pressed: { opacity: 0.75 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
  },
  time: {
    fontSize: 11,
    marginTop: 1,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flagSmall: {
    fontSize: 16,
  },
  countryName: {
    fontSize: 12,
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  content: {
    fontSize: 13,
    lineHeight: 19,
  },
});
