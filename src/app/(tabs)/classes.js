import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import BlueHeader from "../../components/BlueHeader";
import { useSelectedClass } from "../../state/ClassContext";
import { badgeColors, theme } from "../../theme";
import { badgeText } from "../../utils/format";

export default function Classes() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId } = useAuth();
  const { setSelectedClassId } = useSelectedClass();
  const [classes, setClasses] = useState([]);

  const load = useCallback(async () => {
    setClasses(
      await db.getAllAsync(
        `SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
         FROM classes c WHERE c.teacher_id = ? ORDER BY c.id DESC`,
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
      <BlueHeader
        title="My Classes"
        right={{ icon: "add", onPress: () => router.push("/register-class") }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.registerCard}>
          <View style={styles.registerTop}>
            <View style={styles.iconCircle}>
              <Ionicons name="people" size={30} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.registerTitle}>Register a New Class</Text>
              <Text style={styles.muted}>
                Add a new class to start managing your students and results.
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.registerBtn}
            onPress={() => router.push("/register-class")}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.registerBtnText}>Register Class</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>My Classes</Text>
        {classes.length === 0 && (
          <Text style={[styles.muted, { textAlign: "center" }]}>
            No classes yet.
          </Text>
        )}

        {classes.map((c, i) => {
          const color = badgeColors[i % badgeColors.length];
          return (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() => {
                setSelectedClassId(c.id);
                router.navigate("/");
              }}
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
                <View style={styles.countRow}>
                  <Ionicons name="people" size={16} color={theme.greenDark} />
                  <Text style={styles.countText}>
                    {c.student_count} students
                  </Text>
                </View>
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
  muted: { color: theme.muted },
  registerCard: {
    backgroundColor: "#DDEBFA",
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  registerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  registerTitle: { fontSize: 18, fontWeight: "bold", color: theme.text },
  registerBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  registerBtnText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  section: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
    marginTop: 6,
  },
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
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  countText: { color: theme.text },
});
