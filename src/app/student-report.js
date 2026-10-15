import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { resultStatus } from "../utils/format";
import { computeResults } from "../utils/ranking";
import { sharePdf, studentReportHtml } from "../utils/reports";

export default function StudentReport() {
  const db = useSQLiteContext();
  const { classId, studentId } = useLocalSearchParams();
  const cid = Number(classId);
  const stid = Number(studentId);

  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const cls = await db.getFirstAsync(
      "SELECT * FROM classes WHERE id = ?",
      cid,
    );
    const subjects = await db.getAllAsync(
      "SELECT * FROM subjects WHERE class_id = ? ORDER BY id",
      cid,
    );
    const students = await db.getAllAsync(
      "SELECT * FROM students WHERE class_id = ?",
      cid,
    );
    const scores = await db.getAllAsync(
      `SELECT sc.* FROM scores sc JOIN students st ON st.id = sc.student_id WHERE st.class_id = ?`,
      cid,
    );
    const result = computeResults(students, subjects, scores);
    const row = result.rows.find((r) => r.studentId === stid);
    setData({
      cls,
      subjects,
      row,
      classSize: result.rows.length,
      maxTotal: result.maxTotal,
      passMark: result.passMark,
    });
  }, [db, cid, stid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function exportPdf() {
    if (!data || !data.row) return;
    setBusy(true);
    await sharePdf(studentReportHtml(data), `${data.row.name} report`);
    setBusy(false);
  }

  if (!data || !data.row) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: "Student Report" }} />
        <Text style={styles.msg}>Loading...</Text>
      </View>
    );
  }

  const { cls, subjects, row, classSize, maxTotal, passMark } = data;
  const status = resultStatus(row);
  const statusColor =
    status === "Pass"
      ? theme.greenDark
      : status === "Fail"
        ? theme.danger
        : "#8A6100";

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: row.name }} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {row.name.trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{row.name}</Text>
        <Text style={styles.sub}>
          {cls.name} • {row.gender === "M" ? "M" : "F"} •{" "}
          {[cls.term, cls.year].filter(Boolean).join(" ")}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: "#DDEBFA" }]}>
          <Text style={styles.statNum}>{row.rank}</Text>
          <Text style={styles.statLabel}>of {classSize}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: theme.purple }]}>
          <Text style={styles.statNum}>{row.percentage.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Percentage</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: "#fff" }]}>
          <Text style={[styles.statNum, { color: statusColor, fontSize: 20 }]}>
            {status}
          </Text>
          <Text style={styles.statLabel}>Result</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.line, styles.headRow]}>
          <Text style={[styles.cell, styles.subjectCol, styles.headText]}>
            Subject
          </Text>
          <Text style={[styles.cell, styles.numCol, styles.headText]}>
            Mark
          </Text>
          <Text style={[styles.cell, styles.numCol, styles.headText]}>
            Out of
          </Text>
        </View>
        {subjects.map((s, i) => (
          <View key={s.id} style={[styles.line, i % 2 === 1 && styles.altRow]}>
            <Text style={[styles.cell, styles.subjectCol]}>{s.name}</Text>
            <Text
              style={[
                styles.cell,
                styles.numCol,
                row.marks[i] === null && { color: theme.danger },
              ]}
            >
              {row.marks[i] === null ? "-" : row.marks[i]}
            </Text>
            <Text style={[styles.cell, styles.numCol]}>{s.max_score}</Text>
          </View>
        ))}
        <View style={[styles.line, styles.totalRow]}>
          <Text style={[styles.cell, styles.subjectCol, styles.bold]}>
            TOTAL
          </Text>
          <Text style={[styles.cell, styles.numCol, styles.bold]}>
            {row.total}
          </Text>
          <Text style={[styles.cell, styles.numCol, styles.bold]}>
            {maxTotal}
          </Text>
        </View>
      </View>

      <Text style={styles.note}>
        Pass mark: {passMark} (half of the total marks)
      </Text>
      {row.missing > 0 && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            {row.missing} subject{row.missing > 1 ? "s have" : " has"} no mark
            yet. Missing marks count as 0.
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.pdfBtn, busy && { opacity: 0.6 }]}
        onPress={exportPdf}
        disabled={busy}
      >
        <Ionicons name="share-outline" size={22} color="#fff" />
        <Text style={styles.pdfText}>
          {busy ? "Creating PDF..." : "Share student report (PDF)"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  centerMsg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  msg: { textAlign: "center", fontSize: 16, color: theme.muted },
  header: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    textAlign: "center",
  },
  sub: { color: theme.muted, textAlign: "center" },
  stats: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 24, fontWeight: "bold", color: theme.text },
  statLabel: { color: theme.text, fontWeight: "600", fontSize: 13 },
  table: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  line: { flexDirection: "row", alignItems: "center" },
  headRow: { backgroundColor: theme.header },
  altRow: { backgroundColor: "#F2F8FE" },
  totalRow: { backgroundColor: "#DDEBFA" },
  cell: { paddingVertical: 11, paddingHorizontal: 10, color: theme.text },
  headText: { color: "#fff", fontWeight: "bold" },
  subjectCol: { flex: 1 },
  numCol: { width: 80, textAlign: "center" },
  bold: { fontWeight: "bold" },
  note: { textAlign: "center", color: theme.muted },
  warn: { backgroundColor: "#FFF4D6", padding: 10, borderRadius: 10 },
  warnText: { color: "#8A6100", textAlign: "center" },
  pdfBtn: {
    backgroundColor: theme.purpleDark,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  pdfText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
