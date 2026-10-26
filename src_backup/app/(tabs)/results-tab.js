import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import BlueHeader from "../../components/BlueHeader";
import { badgeColors, theme } from "../../theme";
import { badgeText } from "../../utils/format";

export default function ResultsTab() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId } = useAuth();
  const [classes, setClasses] = useState([]);

  const load = useCallback(async () => {
    setClasses(
      await db.getAllAsync(
        "SELECT * FROM classes WHERE teacher_id = ? ORDER BY id DESC",
        teacherId,
      ),
    );
  }, [db, teacherId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BlueHeader title="Results" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Choose a class to view its results</Text>
        {classes.length === 0 && (
          <Text style={styles.muted}>No classes yet.</Text>
        )}
        {classes.map((c, i) => {
          const color = badgeColors[i % badgeColors.length];
          return (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/results",
                  params: { classId: String(c.id) },
                })
              }
            >
              <View style={[styles.badge, { backgroundColor: color.bg }]}>
                <Text style={[styles.badgeText, { color: color.fg }]}>
                  {badgeText(c.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.muted}>
                  {[c.term, c.year].filter(Boolean).join("  •  ")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.muted} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  section: { fontSize: 18, fontWeight: "bold", color: theme.text },
  muted: { color: theme.muted },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 18, fontWeight: "bold" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: theme.text },
});
