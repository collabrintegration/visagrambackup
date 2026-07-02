import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetQuestion } from "@workspace/api-client-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function QuestionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: question, isLoading } = useGetQuestion(Number(id));

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Question not found</Text>
        </View>
      </View>
    );
  }

  const q = question as Record<string, unknown>;
  const title = typeof q["title"] === "string" ? q["title"] : "";
  const body = typeof q["body"] === "string" ? q["body"] : "";
  const userName = typeof q["userName"] === "string" ? q["userName"] : "Traveler";
  const createdAt = typeof q["createdAt"] === "string" ? q["createdAt"] : "";
  const answers = Array.isArray(q["answers"]) ? (q["answers"] as Array<Record<string, unknown>>) : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Question</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.questionBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {userName[0]?.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.authorName, { color: colors.foreground }]}>{userName}</Text>
              <Text style={[styles.authorTime, { color: colors.mutedForeground }]}>
                {timeAgo(createdAt)}
              </Text>
            </View>
          </View>
          <Text style={[styles.questionTitle, { color: colors.foreground }]}>{title}</Text>
          {body.length > 0 && (
            <Text style={[styles.questionBody, { color: colors.cardForeground }]}>{body}</Text>
          )}
        </View>

        <View style={styles.answersHeader}>
          <Text style={[styles.answersTitle, { color: colors.foreground }]}>
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {answers.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No answers yet
            </Text>
          </View>
        ) : (
          answers.map((answer, i) => {
            const aUserName = typeof answer["userName"] === "string" ? answer["userName"] : "Traveler";
            const aContent = typeof answer["content"] === "string" ? answer["content"] : "";
            const aCreatedAt = typeof answer["createdAt"] === "string" ? answer["createdAt"] : "";

            return (
              <View
                key={i}
                style={[
                  styles.answerCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.authorRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {aUserName[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.authorName, { color: colors.foreground }]}>{aUserName}</Text>
                    <Text style={[styles.authorTime, { color: colors.mutedForeground }]}>
                      {timeAgo(aCreatedAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.answerContent, { color: colors.cardForeground }]}>{aContent}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 14,
  },
  topBarTitle: { fontSize: 16, fontWeight: "600" },
  questionBlock: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700" },
  authorName: { fontSize: 13, fontWeight: "600" },
  authorTime: { fontSize: 11, marginTop: 1 },
  questionTitle: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  questionBody: { fontSize: 14, lineHeight: 21 },
  answersHeader: { paddingHorizontal: 16, paddingBottom: 8 },
  answersTitle: { fontSize: 14, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14 },
  answerCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  answerContent: { fontSize: 14, lineHeight: 21 },
  errorText: { fontSize: 15 },
});
