import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import BlueHeader from "../../components/BlueHeader";
import SchoolLogo from "../../components/SchoolLogo";
import { theme } from "../../theme";

export default function Profile() {
  const { teacherName, logout } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BlueHeader title="Profile" />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {teacherName.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{teacherName}</Text>
          <Text style={styles.muted}>Teacher</Text>
          <View style={{ marginTop: 14, alignItems: "center" }}>
            <SchoolLogo size={60} />
            <Text style={styles.school}>Catholic Institute Primary School</Text>
          </View>
        </View>

        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 34, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: theme.text, marginTop: 8 },
  muted: { color: theme.muted },
  school: {
    fontWeight: "bold",
    color: theme.text,
    marginTop: 4,
    textAlign: "center",
  },
  logout: {
    backgroundColor: theme.danger,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
});
