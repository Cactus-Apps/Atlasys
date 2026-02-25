// Version 1.3.6 - © Cactus Apps 2026
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/auth/supabase";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  ShieldCheck,
  Mail,
  Clock,
  Hash,
  Check,
  X,
  Filter,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface DeleteRequest {
  id: string;
  email: string;
  status: string;
  verification_code: string;
  created_at: string;
  expires_at: string;
}

export default function AdminPanel() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const styles = getStyles(isDark);

  const [selectedRequest, setSelectedRequest] = useState<DeleteRequest | null>(
    null,
  );
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from("delete_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) Alert.alert(t("Error_loading"), `${error}`);
    else setRequests(data || []);
    setLoading(false);
  }

  function getDaysLeft(expires_at: string) {
    if (!expires_at) return 0;
    const ms = new Date(expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("delete_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      Alert.alert(t("Error_during_status_update"), `${error}`);
    } else {
      setStatusModalVisible(false);
      setDetailsModalVisible(false);
      loadRequests();
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return { bg: "#D1FAE5", text: "#065F46" };
      case "rejected":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "pending":
        return { bg: "#FEF3C7", text: "#92400E" };
      default:
        return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  const renderRequestItem = ({ item }: { item: DeleteRequest }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedRequest(item);
          setDetailsModalVisible(true);
        }}
        style={styles.card}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.emailContainer}>
            <Mail size={16} color={styles.subTextColor} />
            <Text style={styles.email} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <ChevronRight size={18} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronRight
            size={24}
            color={isDark ? "#fff" : "#000"}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Admin_Panel")}</Text>
        <TouchableOpacity onPress={loadRequests} style={styles.filterButton}>
          <Filter size={20} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShieldCheck size={48} color="#94a3b8" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No deletion requests found</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <X size={24} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Mail size={20} color={styles.subTextColor} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Email Address</Text>
                    <Text style={styles.detailValue}>
                      {selectedRequest.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <ShieldCheck
                    size={20}
                    color={getStatusColor(selectedRequest.status).text}
                  />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Current Status</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getStatusColor(selectedRequest.status).text },
                      ]}
                    >
                      {selectedRequest.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Hash size={20} color={styles.subTextColor} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Verification Code</Text>
                    <Text style={styles.detailValue}>
                      {selectedRequest.verification_code}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Clock size={20} color={styles.subTextColor} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Time Remaining</Text>
                    <Text style={styles.detailValue}>
                      {getDaysLeft(selectedRequest.expires_at)} days left
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setStatusModalVisible(true)}
                >
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalBox}>
            <Text style={styles.modalTitle}>Select New Status</Text>
            {["Pending", "Completed", "Rejected", "Deleted"].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.statusOption}
                onPress={() =>
                  updateStatus(selectedRequest!.id, status.toLowerCase())
                }
              >
                <Text style={styles.statusOptionText}>{status}</Text>
                {selectedRequest?.status.toLowerCase() ===
                  status.toLowerCase() && (
                  <Check size={20} color="#2563EB" strokeWidth={3} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const bg = isDark ? "#0D1117" : "#F8FAFC";
  const cardBg = isDark ? "#161B22" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#1E293B";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.05)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    subTextColor: subTextColor as any,
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: textColor,
    },
    backButton: {
      padding: 8,
    },
    filterButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    emailContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 8,
    },
    email: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateText: {
      fontSize: 13,
      color: subTextColor,
      fontWeight: "600",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: subTextColor,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: bg,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: textColor,
    },
    detailsContainer: {
      gap: 20,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    detailTextContainer: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
      marginTop: 2,
    },
    actionButton: {
      backgroundColor: "#2563EB",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 12,
    },
    actionButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    statusModalBox: {
      backgroundColor: bg,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      width: "100%",
    },
    statusOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    statusOptionText: {
      fontSize: 17,
      fontWeight: "700",
      color: textColor,
    },
    cancelButton: {
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#EF4444",
    },
  });
};
