import React from "react";
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, Platform, StyleSheet,
} from "react-native";
import { Info, Sparkles, AlertTriangle, X } from "lucide-react-native";
import { Announcement, markAllSeen } from "@/lib/announcements";
import { useAppTheme } from "@/lib/theme";

interface Props {
  announcements: Announcement[];
  onClose: () => void;
}

const TYPE_CONFIG = {
  info:    { icon: Info,          color: "#3B82F6", bg: "#EFF6FF", label: "Info" },
  update:  { icon: Sparkles,      color: "#8B5CF6", bg: "#F5F3FF", label: "Was ist neu" },
  warning: { icon: AlertTriangle, color: "#F59E0B", bg: "#FFFBEB", label: "Wichtig" },
};

export default function AnnouncementModal({ announcements, onClose }: Props) {
  const theme = useAppTheme();

  const handleClose = async () => {
    await markAllSeen(announcements.map((a) => a.id));
    onClose();
  };

  if (!announcements.length) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: theme.cardBg }]}>

          {/* Header */}
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: theme.textColor }]}>
              {announcements.length === 1
                ? announcements[0].type === "update"
                  ? "🆕 Was ist neu"
                  : "📢 Nachricht"
                : `📢 ${announcements.length} Neuigkeiten`}
            </Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <X size={18} color={theme.subTextColor} />
            </TouchableOpacity>
          </View>

          {/* Announcements */}
          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
          >
            {announcements.map((a, idx) => {
              const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <View
                  key={a.id}
                  style={[
                    s.item,
                    { borderColor: theme.borderColor },
                    idx < announcements.length - 1 && s.itemBorder,
                  ]}
                >
                  {/* Type Badge */}
                  <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Icon size={14} color={cfg.color} />
                    <Text style={[s.badgeText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>

                  <Text style={[s.itemTitle, { color: theme.textColor }]}>
                    {a.title}
                  </Text>
                  <Text style={[s.itemMsg, { color: theme.subTextColor }]}>
                    {a.message}
                  </Text>

                  <Text style={[s.itemDate, { color: theme.subTextColor }]}>
                    {new Date(a.created_at).toLocaleDateString("de", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Button */}
          <TouchableOpacity style={s.okBtn} onPress={handleClose}>
            <Text style={s.okText}>Verstanden</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: { fontSize: 20, fontWeight: "700" },
  closeBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 6,
  },
  item: { paddingVertical: 16 },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  itemMsg: { fontSize: 14, lineHeight: 21 },
  itemDate: { fontSize: 11, marginTop: 8 },
  okBtn: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  okText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});