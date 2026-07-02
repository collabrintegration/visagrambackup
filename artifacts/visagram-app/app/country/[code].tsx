import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarRating } from "@/components/StarRating";
import { VisaBadge } from "@/components/VisaBadge";
import { useColors } from "@/hooks/useColors";
import {
  useGetCountry,
  useGetCountryQuestions,
  useGetCountryReviews,
} from "@workspace/api-client-react";

function flagEmoji(code: string | undefined | null) {
  if (!code || code.length < 2) return "🏳";
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
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tab = "overview" | "reviews" | "qa";

export default function CountryDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: country, isLoading } = useGetCountry(code ?? "");
  const { data: reviews } = useGetCountryReviews(code ?? "");
  const { data: questions } = useGetCountryQuestions(code ?? "");

  if (isLoading || !country) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingHeader}>
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

  const reviewList = (reviews as { reviews?: Array<Record<string, unknown>> } | null)?.reviews ?? [];
  const questionList = (questions as Array<Record<string, unknown>>) ?? [];
  const visas = (country as Record<string, unknown>)["visas"] as Array<Record<string, unknown>> ?? [];

  const avgRating =
    reviewList.length > 0
      ? reviewList.reduce((s, r) => s + (typeof r["rating"] === "number" ? r["rating"] : 0), 0) /
        reviewList.length
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroFlag}>{flagEmoji(country.code)}</Text>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{country.name}</Text>
          <Text style={[styles.heroContinent, { color: colors.mutedForeground }]}>
            {(country as Record<string, unknown>)["continent"] as string ?? ""}
          </Text>
          {avgRating !== null && (
            <View style={styles.ratingRow}>
              <StarRating rating={Math.round(avgRating)} />
              <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                {avgRating.toFixed(1)} · {reviewList.length} review{reviewList.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {(["overview", "reviews", "qa"] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.primary : colors.mutedForeground },
                ]}
              >
                {tab === "overview" ? "Overview" : tab === "reviews" ? `Reviews (${reviewList.length})` : `Q&A (${questionList.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "overview" && (
          <View style={styles.section}>
            {visas.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="info" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No visa information available
                </Text>
              </View>
            ) : (
              visas.slice(0, 8).map((visa, i) => {
                const entryType = typeof visa["entryType"] === "string" ? visa["entryType"] : "";
                const passportCountry = typeof visa["passportCountry"] === "string" ? visa["passportCountry"] : "";
                const passportCode = typeof visa["passportCode"] === "string" ? visa["passportCode"] : "";
                const maxStay = typeof visa["maxStay"] === "number" ? visa["maxStay"] : null;
                const fee = typeof visa["fee"] === "number" ? visa["fee"] : null;

                return (
                  <View
                    key={i}
                    style={[styles.visaRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={styles.passportFlag}>{flagEmoji(passportCode || "XX")}</Text>
                    <View style={styles.visaInfo}>
                      <Text style={[styles.passportName, { color: colors.foreground }]} numberOfLines={1}>
                        {passportCountry}
                      </Text>
                      {maxStay !== null && (
                        <Text style={[styles.visaDetail, { color: colors.mutedForeground }]}>
                          Up to {maxStay} days
                          {fee !== null && fee > 0 ? ` · $${fee}` : ""}
                        </Text>
                      )}
                    </View>
                    <VisaBadge entryType={entryType} compact />
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === "reviews" && (
          <View style={styles.section}>
            {reviewList.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="star" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No reviews yet
                </Text>
              </View>
            ) : (
              reviewList.map((review, i) => {
                const rating = typeof review["rating"] === "number" ? review["rating"] : 0;
                const content = typeof review["content"] === "string" ? review["content"] : "";
                const userName = typeof review["userName"] === "string" ? review["userName"] : "Traveler";
                const createdAt = typeof review["createdAt"] === "string" ? review["createdAt"] : "";

                return (
                  <View
                    key={i}
                    style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={[styles.reviewAvatar, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
                          {userName[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <Text style={[styles.reviewUser, { color: colors.foreground }]}>{userName}</Text>
                        <Text style={[styles.reviewTime, { color: colors.mutedForeground }]}>
                          {timeAgo(createdAt)}
                        </Text>
                      </View>
                      <StarRating rating={rating} />
                    </View>
                    {content.length > 0 && (
                      <Text style={[styles.reviewContent, { color: colors.cardForeground }]}>
                        {content}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === "qa" && (
          <View style={styles.section}>
            {questionList.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="help-circle" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No questions yet
                </Text>
              </View>
            ) : (
              questionList.map((q, i) => {
                const title = typeof q["title"] === "string" ? q["title"] : "";
                const body = typeof q["body"] === "string" ? q["body"] : "";
                const answerCount = typeof q["answerCount"] === "number" ? q["answerCount"] : 0;
                const userName = typeof q["userName"] === "string" ? q["userName"] : "Traveler";
                const createdAt = typeof q["createdAt"] === "string" ? q["createdAt"] : "";
                const id = typeof q["id"] === "number" ? q["id"] : null;

                return (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.questionCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => id !== null && router.push(`/question/${id}`)}
                  >
                    <Text style={[styles.questionTitle, { color: colors.foreground }]}>
                      {title}
                    </Text>
                    {body.length > 0 && (
                      <Text style={[styles.questionBody, { color: colors.cardForeground }]} numberOfLines={2}>
                        {body}
                      </Text>
                    )}
                    <View style={styles.questionFooter}>
                      <Text style={[styles.questionMeta, { color: colors.mutedForeground }]}>
                        {userName} · {timeAgo(createdAt)}
                      </Text>
                      <View style={styles.answerCount}>
                        <Feather name="message-circle" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.answerCountText, { color: colors.mutedForeground }]}>
                          {answerCount}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingHeader: { padding: 16, paddingTop: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 4 },
  heroSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 6,
  },
  heroFlag: { fontSize: 64, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: "700", textAlign: "center", letterSpacing: -0.5 },
  heroContinent: { fontSize: 14 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  ratingText: { fontSize: 13 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  section: { paddingTop: 14, gap: 10, paddingHorizontal: 16 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  visaRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  passportFlag: { fontSize: 24 },
  visaInfo: { flex: 1 },
  passportName: { fontSize: 14, fontWeight: "500" },
  visaDetail: { fontSize: 12, marginTop: 2 },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { fontSize: 13, fontWeight: "700" },
  reviewMeta: { flex: 1 },
  reviewUser: { fontSize: 13, fontWeight: "600" },
  reviewTime: { fontSize: 11, marginTop: 1 },
  reviewContent: { fontSize: 14, lineHeight: 20 },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  questionTitle: { fontSize: 15, fontWeight: "600", lineHeight: 21 },
  questionBody: { fontSize: 13, lineHeight: 19 },
  questionFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  questionMeta: { fontSize: 11 },
  answerCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  answerCountText: { fontSize: 12 },
});
