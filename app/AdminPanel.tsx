// Version 1.3.6 - © Cactus Apps 2025
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

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
  const [selectedRequest, setSelectedRequest] = useState<DeleteRequest | null>(
    null
  );
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const { data, error } = await supabase
      .from("delete_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) Alert.alert(t('Error_loading'), `${error}`);
    else setRequests(data || []);
  }

  function getDaysLeft(expires_at: string) {
    const ms = new Date(expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("delete_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      Alert.alert(t('Error_during_status_update'), `${error}`);
    } else {
      setStatusModalVisible(false);
      setDetailsModalVisible(false);
      loadRequests();
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Admin_Panel')}</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        onRefresh={() => updateStatus}
        refreshing={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedRequest(item);
              setDetailsModalVisible(true);
            }}
            style={styles.card}
          >
            <Text style={styles.email}>{item.email}</Text>
            <Text>{t('status:')} {item.status}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            {selectedRequest && (
              <>
                <Text style={styles.modalTitle}>{t('Application_details')}</Text>
                <Text>{t('Email:')} {selectedRequest.email}</Text>
                <Text>{t('Status:')} {selectedRequest.status}</Text>
                <Text>{t('Code:')} {selectedRequest.verification_code}</Text>
                <Text>{getDaysLeft(selectedRequest.expires_at)} {t('days_left')}</Text>

                <View style={styles.modalButtonRow}>
                  <Button
                    title={t("Cancel")}
                    onPress={() => setDetailsModalVisible(false)}
                  />
                  <Button
                    title={t("Change_status")}
                    onPress={() => setStatusModalVisible(true)}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('Select_new_status')}</Text>

            <Button
              title="Deleted"
              onPress={() => updateStatus(selectedRequest!.id, "deleted")}
            />
            <Button
              title="Pending"
              onPress={() => updateStatus(selectedRequest!.id, "pending")}
            />

            <Button
              title="Completed"
              onPress={() => updateStatus(selectedRequest!.id, "completed")}
            />
            <Button
              title="Rejected"
              onPress={() => updateStatus(selectedRequest!.id, "rejected")}
            />
            <Button
              title="Back"
              color="gray"
              onPress={() => setStatusModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  email: { fontWeight: "bold", fontSize: 16 },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});
