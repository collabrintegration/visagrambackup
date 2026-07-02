import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetPassportRankings, useListDestinationsByPassport } from "@workspace/api-client-react";

function flagEmoji(code: string | undefined | null) {
  if (!code || code.length < 2) return "🏳";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function PassportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const { data: rankings, isLoading: rankingsLoading } = useGetPassportRankings();

  const { data: destinations } = useListDestinationsByPassport(
    { passportCode: selectedCode! },
    { query: { enabled: !!selectedCode } }
  );

  const filteredRankings = useMemo(() => {
    if (!rankings) return [];
    if (!pickerSearch) return rankings;
    const q = pickerSearch.toLowerCase();
    return rankings.filter(
      (r) =>
        r.passportCountry.toLowerCase().includes(q) ||
        r.passportCode.toLowerCase().includes(q)
    );
  }, [rankings, pickerSearch]);

  const selectedEntry = useMemo(
    () => rankings?.find((r) => r.passportCode === selectedCode),
    [rankings, selectedCode]
  );

  const rankedList = rankings ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Passport Power</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Compare passport strength worldwide
        </Text>
      </View>

      <Pressable
        style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setShowPicker(true)}
      >
        {selectedCode ? (
          <Text style={styles.pickerFlag}>{flagEmoji(selectedCode)}</Text>
        ) : (
          <Feather name="globe" size={20} color={colors.mutedForeground} />
        )}
        <Text style={[styles.pickerText, { color: selectedEntry ? colors.foreground : colors.mutedForeground }]}>
          {selectedEntry ? selectedEntry.passportCountry : "Select your passport"}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>

      {selectedEntry && (
        <View style={styles.statsRow}>
          <StatBox value={selectedEntry.visaFree} label="Visa Free" color="#4ADE80" />
          <StatBox value={selectedEntry.visaOnArrival} label="On Arrival" color="#FACC15" />
          <StatBox value={selectedEntry.eVisa} label="eVisa" color="#60A5FA" />
          <StatBox value={selectedEntry.visaRequired} label="Required" color="#F87171" />
        </View>
      )}

      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Global Rankings</Text>
      </View>

      {rankingsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={rankedList}
          keyExtractor={(item) => item.passportCode}
          renderItem={({ item, index }) => (
            <Pressable
              style={({ pressed }) => [
                styles.rankRow,
                { backgroundColor: item.passportCode === selectedCode ? colors.secondary : colors.card, borderColor: item.passportCode === selectedCode ? colors.primary : colors.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setSelectedCode(item.passportCode)}
            >
              <Text style={[styles.rank, { color: index < 3 ? "#E2A93C" : colors.mutedForeground }]}>
                #{index + 1}
              </Text>
              <Text style={styles.rankFlag}>{flagEmoji(item.passportCode)}</Text>
              <View style={styles.rankInfo}>
                <Text style={[styles.rankCountry, { color: colors.foreground }]} numberOfLines={1}>
                  {item.passportCountry}
                </Text>
                <Text style={[styles.rankTotal, { color: colors.mutedForeground }]}>
                  {item.total} destinations
                </Text>
              </View>
              <Text style={[styles.freeCount, { color: "#4ADE80" }]}>{item.visaFree}</Text>
            </Pressable>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
          ]}
        />
      )}

      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Passport</Text>
            <Pressable onPress={() => { setShowPicker(false); setPickerSearch(""); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.modalSearch, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              style={[styles.modalSearchInput, { color: colors.foreground }]}
              placeholder="Search countries..."
              placeholderTextColor={colors.mutedForeground}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredRankings}
            keyExtractor={(item) => item.passportCode}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedCode(item.passportCode);
                  setShowPicker(false);
                  setPickerSearch("");
                }}
              >
                <Text style={styles.pickerItemFlag}>{flagEmoji(item.passportCode)}</Text>
                <Text style={[styles.pickerItemName, { color: colors.foreground }]}>
                  {item.passportCountry}
                </Text>
                <Text style={[styles.pickerItemScore, { color: colors.primary }]}>
                  {item.total}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
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
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  pickerFlag: { fontSize: 22 },
  pickerText: { flex: 1, fontSize: 15, fontWeight: "500" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingTop: 4 },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 3,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  rank: { width: 32, fontSize: 12, fontWeight: "700", textAlign: "center" },
  rankFlag: { fontSize: 22 },
  rankInfo: { flex: 1 },
  rankCountry: { fontSize: 14, fontWeight: "600" },
  rankTotal: { fontSize: 11, marginTop: 1 },
  freeCount: { fontSize: 14, fontWeight: "700" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSearch: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modalSearchInput: { flex: 1, fontSize: 15 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  pickerItemFlag: { fontSize: 24 },
  pickerItemName: { flex: 1, fontSize: 15 },
  pickerItemScore: { fontSize: 13, fontWeight: "600" },
});
