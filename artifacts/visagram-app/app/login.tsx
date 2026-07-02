import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
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

const STATS = [
  { value: "190+", label: "Countries covered" },
  { value: "50K+", label: "Travelers connected" },
];

const FEATURES = [
  "💬 Group chats",
  "🗺️ Visa tracker",
  "⭐ Reviews",
  "🤝 Community Q&A",
];

const AVATARS = ["🇧🇷", "🇫🇷", "🇮🇳", "🇯🇵"];

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Already signed in — skip login
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading]);

  const handleSignIn = async () => {
    await WebBrowser.openBrowserAsync(`https://${DOMAIN}/profile`);
  };

  const handleExplore = () => {
    router.replace("/(tabs)");
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Background blobs */}
      <View style={[styles.blob1, { backgroundColor: colors.primary }]} />
      <View style={[styles.blob2, { backgroundColor: "#db2777" }]} />

      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={[styles.iconBox, { shadowColor: colors.primary }]}>
          <Feather name="globe" size={40} color="#fff" />
        </View>
        <View style={styles.logoTextRow}>
          <Text style={[styles.logoText, { color: colors.foreground }]}>visa</Text>
          <Text style={[styles.logoAccent, { color: "#db2777" }]}>gram</Text>
          <Text style={[styles.logoDot, { color: "#db2777" }]}>.</Text>
        </View>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          The travel community for visa explorers
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View
            key={s.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Social proof */}
      <View style={[styles.socialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.avatarStack}>
          {AVATARS.map((flag, i) => (
            <View
              key={i}
              style={[
                styles.avatarFlag,
                { backgroundColor: colors.secondary, borderColor: colors.background, marginLeft: i === 0 ? 0 : -10 },
              ]}
            >
              <Text style={styles.avatarFlagText}>{flag}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.socialTitle, { color: colors.foreground }]}>
            Join thousands of travelers
          </Text>
          <Text style={[styles.socialSub, { color: colors.mutedForeground }]}>
            sharing visa tips &amp; experiences
          </Text>
        </View>
      </View>

      {/* Feature pills */}
      <View style={styles.pillsRow}>
        {FEATURES.map((f) => (
          <View
            key={f}
            style={[styles.pill, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Text style={[styles.pillText, { color: colors.primary }]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA buttons */}
      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSignIn}
        >
          <Feather name="log-in" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Continue with Replit</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
            pressed && { opacity: 0.75 },
          ]}
          onPress={handleExplore}
        >
          <Feather name="globe" size={15} color={colors.mutedForeground} />
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>
            Explore visas without signing in
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.legal, { color: colors.mutedForeground }]}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  blob1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.12,
    top: -80,
    left: -80,
  },
  blob2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.1,
    top: 140,
    right: -60,
  },
  logoSection: { alignItems: "center", gap: 12, marginBottom: 28 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    // gradient-like: use a solid primary
    backgroundColor: "#7c3aed",
  },
  logoTextRow: { flexDirection: "row", alignItems: "flex-end" },
  logoText: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  logoAccent: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  logoDot: { fontSize: 40, fontWeight: "900" },
  tagline: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 12, width: "100%", marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "flex-start",
    gap: 4,
  },
  statValue: { fontSize: 26, fontWeight: "900" },
  statLabel: { fontSize: 12 },

  socialCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarStack: { flexDirection: "row" },
  avatarFlag: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFlagText: { fontSize: 18 },
  socialTitle: { fontSize: 13, fontWeight: "700" },
  socialSub: { fontSize: 11, marginTop: 2 },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontWeight: "600" },

  buttons: { width: "100%", gap: 12, marginBottom: 20 },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#7c3aed",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  secondaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "500" },
  legal: { fontSize: 11, textAlign: "center", opacity: 0.7 },
});
