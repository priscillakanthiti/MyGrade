import { Ionicons } from "@expo/vector-icons";
import {
    Stack,
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { resultStatus } from "../utils/format";
import { computeResults } from "../utils/ranking";
import { classReportHtml, sharePdf } from "../utils/reports";

export default function Results() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const cid = Number(classId);

  const [cls, setCls] = useState(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [maxTotal, setMaxTotal] = useState(0);
  const [passMark, setPassMark] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const c = await db.getFirstAsync("SELECT * FROM classes WHERE id = ?", cid);
    const subs = await db.getAllAsync(
      "SELECT * FROM subjects WHERE class_id = ? ORDER BY id",
      cid,
    );
    const studs = await db.getAllAsync(
      "SELECT * FROM students WHERE class_id = ?",
      cid,
    );
    const scores = await db.getAllAsync(
      `SELECT sc.* FROM scores sc JOIN students st ON st.id = sc.student_id WHERE st.class_id = ?`,
      cid,
    );
    const result = computeResults(studs, subs, scores);
    setCls(c);
    setSubjectCount(subs.length);
    setRows(result.rows);
    setMaxTotal(result.maxTotal);
    setPassMark(result.passMark);
  }, [db, cid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const complete = rows.filter((r) => r.missing === 0);
  const passedCount = complete.filter((r) => r.passed).length;
  const failedCount = complete.filter((r) => !r.passed).length;
  const incompleteCount = rows.length - complete.length;

  async function exportPdf() {
    if (!cls) return;
    setBusy(true);
    const html = classReportHtml({
      cls,
      rows,
      subjectCount,
      maxTotal,
      passMark,
    });
    await sharePdf(html, `${cls.name}_class_results`, `${cls.name} class results`);
    setBusy(false);
  }

  if (subjectCount === 0 || rows.length === 0) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: "Results" }} />
        <Text style={styles.msg}>
          Add subjects and students, then enter marks, to see the results.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Results" }} />

      <View style={styles.header}>
        <Text style={styles.title}>{cls ? cls.name : ""}</Text>
        <Text style={styles.sub}>
          {cls ? [cls.term, cls.year].filter(Boolean).join("  •  ") : ""}
        </Text>
        <Text style={styles.sub}>
          {rows.length} students • {subjectCount} subjects • Total {maxTotal} •
          Pass mark {passMark}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: theme.green }]}>
          <Text style={[styles.statNum, { color: theme.greenDark }]}>
            {passedCount}
          </Text>
          <Text style={styles.statLabel}>Passed</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: "#FDECEA" }]}>
          <Text style={[styles.statNum, { color: theme.danger }]}>
            {failedCount}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        {incompleteCount > 0 && (
          <View style={[styles.stat, { backgroundColor: "#FFF4D6" }]}>
            <Text style={[styles.statNum, { color: "#8A6100" }]}>
              {incompleteCount}
            </Text>
            <Text style={styles.statLabel}>Incomplete</Text>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.pdfBtn, busy && { opacity: 0.6 }]}
        onPress={exportPdf}
        disabled={busy}
      >
        <Ionicons name="share-outline" size={22} color="#fff" />
        <Text style={styles.pdfText}>
          {busy ? "Creating PDF..." : "Share class report (PDF)"}
        </Text>
      </Pressable>

      {incompleteCount > 0 && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            {incompleteCount} student{incompleteCount > 1 ? "s have" : " has"}{" "}
            missing marks. A missing mark counts as 0, and Pass/Fail shows once
            all marks are entered.
          </Text>
        </View>
      )}

      <Text style={styles.hint}>
        Tap a student to open their individual report.
      </Text>

      <View style={styles.table}>
        <View style={[styles.row, styles.headRow]}>
          <Text style={[styles.cell, styles.pos, styles.headText]}>Pos</Text>
          <Text style={[styles.cell, styles.nameCol, styles.headText]}>
            Name
          </Text>
          <Text style={[styles.cell, styles.gen, styles.headText]}>Sex</Text>
          <Text style={[styles.cell, styles.totalCol, styles.headText]}>
            Total
          </Text>
          <Text style={[styles.cell, styles.resultCol, styles.headText]}>
            Result
          </Text>
        </View>

        {rows.map((r, i) => {
          const status = resultStatus(r);
          return (
            <Pressable
              key={r.studentId}
              style={[styles.row, i % 2 === 1 && styles.altRow]}
              onPress={() =>
                router.push({
                  pathname: "/student-report",
                  params: {
                    classId: String(cid),
                    studentId: String(r.studentId),
                  },
                })
              }
            >
              <Text style={[styles.cell, styles.pos, styles.bold]}>
                {r.rank}
              </Text>
              <Text style={[styles.cell, styles.nameCol]} numberOfLines={2}>
                {r.name}
              </Text>
              <Text style={[styles.cell, styles.gen]}>{r.gender}</Text>
              <Text style={[styles.cell, styles.totalCol, styles.bold]}>
                {r.total}/{maxTotal}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.resultCol,
                  styles.bold,
                  status === "Pass" && { color: theme.greenDark },
                  status === "Fail" && { color: theme.danger },
                  status === "Incomplete" && { color: "#8A6100" },
                ]}
              >
                {status}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    gap: 2,
  },
  title: { fontSize: 26, fontWeight: "bold", color: theme.text },
  sub: { color: theme.muted, textAlign: "center" },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "bold" },
  statLabel: { color: theme.text, fontWeight: "600" },
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
  warn: { backgroundColor: "#FFF4D6", padding: 10, borderRadius: 10 },
  warnText: { color: "#8A6100", textAlign: "center" },
  hint: { textAlign: "center", color: theme.muted, fontSize: 13 },
  table: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center" },
  headRow: { backgroundColor: theme.header },
  altRow: { backgroundColor: "#F2F8FE" },
  cell: {
    paddingVertical: 11,
    paddingHorizontal: 4,
    textAlign: "center",
    color: theme.text,
  },
  headText: { color: "#fff", fontWeight: "bold" },
  pos: { width: 40 },
  nameCol: { flex: 1, textAlign: "left" },
  gen: { width: 34 },
  totalCol: { width: 82 },
  resultCol: { width: 82 },
  bold: { fontWeight: "bold" },
});

