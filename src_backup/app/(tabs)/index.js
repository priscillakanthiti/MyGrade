import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import BlueHeader from "../../components/BlueHeader";
import SchoolLogo from "../../components/SchoolLogo";
import { useSelectedClass } from "../../state/ClassContext";
import { theme } from "../../theme";

export default function Home() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId, teacherName } = useAuth();
  const { selectedClassId, setSelectedClassId } = useSelectedClass();

  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);

  const current =
    classes.find((c) => c.id === selectedClassId) || classes[0] || null;

  const load = useCallback(async () => {
    const list = await db.getAllAsync(
      "SELECT * FROM classes WHERE teacher_id = ? ORDER BY id DESC",
      teacherId,
    );
    setClasses(list);
    const cur = list.find((c) => c.id === selectedClassId) || list[0] || null;
    if (cur && cur.id !== selectedClassId) setSelectedClassId(cur.id);
    if (cur) {
      const st = await db.getFirstAsync(
        "SELECT COUNT(*) AS n FROM students WHERE class_id = ?",
        cur.id,
      );
      const su = await db.getFirstAsync(
        "SELECT COUNT(*) AS n FROM subjects WHERE class_id = ?",
        cur.id,
      );
      setStudentCount(st ? st.n : 0);
      setSubjectCount(su ? su.n : 0);
    } else {
      setStudentCount(0);
      setSubjectCount(0);
    }
  }, [db, teacherId, selectedClassId, setSelectedClassId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function go(path) {
    if (!current) return;
    router.push({ pathname: path, params: { classId: String(current.id) } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BlueHeader title="My Grade App" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeSmall}>Welcome,</Text>
            <Text style={styles.name}>{teacherName} 👋</Text>
            <Text style={styles.muted}>You're making a difference!</Text>
          </View>
          <View style={{ alignItems: "center", width: 100 }}>
            <SchoolLogo size={64} />
            <Text style={styles.logoText}>
              Catholic Institute Primary School
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          {current ? (
            <>
              <Pressable style={styles.dropdown} onPress={() => setOpen(!open)}>
                <Ionicons
                  name="people-circle"
                  size={26}
                  color={theme.primary}
                />
                <Text style={styles.dropText}>{current.name}</Text>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={22}
                  color={theme.text}
                />
              </Pressable>
              {open && (
                <View style={styles.options}>
                  {classes.map((c) => (
                    <Pressable
                      key={c.id}
                      style={styles.option}
                      onPress={() => {
                        setSelectedClassId(c.id);
                        setOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          c.id === current.id && {
                            fontWeight: "bold",
                            color: theme.primary,
                          },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.row}>
                <View style={[styles.tile, { backgroundColor: "#DDEBFA" }]}>
                  <Ionicons name="people" size={26} color={theme.primary} />
                  <Text style={styles.big}>{studentCount}</Text>
                  <Text style={styles.tileLabel}>Students</Text>
                </View>
                <Pressable
                  style={[styles.tile, { backgroundColor: "#DDEBFA" }]}
                  onPress={() => go("/subjects")}
                >
                  <Ionicons name="book" size={26} color={theme.primary} />
                  <Text style={styles.big}>{subjectCount}</Text>
                  <Text style={styles.tileLabel}>Subjects</Text>
                  <Text style={styles.tap}>Tap to manage</Text>
                </Pressable>
              </View>

              <View style={styles.row}>
                <Pressable
                  style={[styles.action, { backgroundColor: theme.green }]}
                  onPress={() => go("/students")}
                >
                  <View
                    style={[
                      styles.circle,
                      { backgroundColor: theme.greenDark },
                    ]}
                  >
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <Text
                    style={[styles.actionTitle, { color: theme.greenDark }]}
                  >
                    Students
                  </Text>
                  <Text style={styles.actionSub}>View and manage students</Text>
                </Pressable>
                <Pressable
                  style={[styles.action, { backgroundColor: theme.purple }]}
                  onPress={() => go("/results")}
                >
                  <View
                    style={[
                      styles.circle,
                      { backgroundColor: theme.purpleDark },
                    ]}
                  >
                    <Ionicons name="stats-chart" size={24} color="#fff" />
                  </View>
                  <Text
                    style={[styles.actionTitle, { color: theme.purpleDark }]}
                  >
                    Results
                  </Text>
                  <Text style={styles.actionSub}>
                    Enter, calculate and view results
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={{ alignItems: "center", gap: 12, padding: 10 }}>
              <Ionicons name="school" size={40} color={theme.primary} />
              <Text style={styles.dropText}>No class yet</Text>
              <Text style={styles.muted}>
                Register your first class to get started.
              </Text>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => router.push("/register-class")}
              >
                <Text style={styles.primaryText}>Register Class</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          Better Data. Better Decisions. Better Learning.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  welcomeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  welcomeSmall: { fontSize: 20, color: theme.text },
  name: { fontSize: 28, fontWeight: "bold", color: theme.text },
  muted: { color: theme.muted },
  logoText: {
    fontSize: 10,
    fontWeight: "bold",
    color: theme.text,
    textAlign: "center",
    marginTop: 2,
  },
  panel: { backgroundColor: "#fff", borderRadius: 20, padding: 14, gap: 12 },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F2F8FE",
  },
  dropText: { flex: 1, fontSize: 18, fontWeight: "bold", color: theme.primary },
  options: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  option: {
    padding: 14,
    backgroundColor: "#F7FAFE",
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  optionText: { fontSize: 16, color: theme.text },
  row: { flexDirection: "row", gap: 12 },
  tile: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 2,
  },
  big: { fontSize: 34, fontWeight: "bold", color: theme.text },
  tileLabel: { fontSize: 16, color: theme.text },
  tap: { fontSize: 11, color: theme.primary },
  action: { flex: 1, borderRadius: 14, padding: 14, gap: 6 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 18, fontWeight: "bold" },
  actionSub: { color: theme.muted, fontSize: 13 },
  primaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: {
    textAlign: "center",
    color: theme.muted,
    fontStyle: "italic",
    fontSize: 12,
    marginTop: 6,
  },
});
