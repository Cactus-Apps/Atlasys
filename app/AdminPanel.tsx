import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface DeleteRequest {
  id: string;
  email: string;
  status: "pending" | "approved" | "completed";
  requested_at: string;
  updated_at: string;
}

export default function AdminPanel() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delete_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) console.error(error);
    else setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("delete_requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delete_requests" },
        (payload: any) => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (
    id: string,
    newStatus: DeleteRequest["status"]
  ) => {
    const { error } = await supabase
      .from("delete_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(error);
      Alert.alert("Fehler", "Status konnte nicht geändert werden.");
    } else {
      Alert.alert("Erfolg", "Status wurde geändert.");
      loadRequests();
    }
  };

  const renderItem = ({ item }: { item: DeleteRequest }) => (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        Alert.alert(
          "Antragsdetails",
          `📧 ${item.email}\n📅 Angefragt: ${new Date(
            item.requested_at
          ).toLocaleString()}\n📦 Status: ${item.status}`,
          [
            { text: "Abbrechen", style: "cancel" },
            {
              text: "Status ändern",
              onPress: () => {
                Alert.prompt(
                  "Neuer Status",
                  "pending / approved / completed",
                  [
                    { text: "Abbrechen", style: "cancel" },
                    {
                      text: "Speichern",
                      onPress: (status: any) => {
                        const validStatuses = [
                          "pending",
                          "approved",
                          "completed",
                        ];
                        if (validStatuses.includes(status)) {
                          updateStatus(
                            item.id,
                            status as DeleteRequest["status"]
                          );
                        } else {
                          Alert.alert(
                            "Ungültiger Status",
                            "Bitte einen gültigen Status eingeben."
                          );
                        }
                      },
                    },
                  ],
                  "plain-text",
                  item.status
                );
              },
            },
          ]
        )
      }
    >
      <Text style={styles.text3}>{item.email}</Text>
      <Text style={styles.text5}>Status: {item.status}</Text>
      <Text style={styles.text4}>
        {new Date(item.requested_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.text}>
      <Text style={styles.text2}>Löschanträge</Text>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRequests} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    backgroundColor: "white",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  text: {
    padding: 1,
    fontSize: 18,
    fontWeight: "bold",
  },
  text2: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
    color: "#fff",
    marginTop: 30,
  },
  text3: {
    fontSize: 18,
    fontWeight: "bold",
  },
  text4: {
    fontSize: 12,
    color: "#6B7280",
  },
  text5: {},
});
