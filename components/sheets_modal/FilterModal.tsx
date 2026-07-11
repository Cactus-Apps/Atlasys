import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import {
  X,
  Utensils,
  TreePine,
  ShoppingBag,
  Building,
  Bus,
  UtensilsCrossed,
  Beer,
  Coffee,
  Sandwich,
  Building2,
  Music,
  Dumbbell,
  Film,
  Palette,
  Sparkles,
  BookOpen,
  ShoppingCart,
  SoapDispenserDroplet,
  Cpu,
  Car,
  Shirt,
  Hospital,
  Landmark,
  SquareParking,
  Key,
  Wrench,
  Droplets,
  Pill,
  TrainFront,
  TrainTrack,
  Leaf,
  FerrisWheel,
  Ambulance,
} from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import type { FilterCategory, FilterItem } from "@/app/(tabs)/mapscreen";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Utensils,
  UtensilsCrossed,
  Beer,
  Coffee,
  Sandwich,
  TreePine,
  Music,
  Dumbbell,
  Film,
  Palette,
  Sparkles,
  BookOpen,
  ShoppingBag,
  ShoppingCart,
  SoapDispenserDroplet,
  Cpu,
  Car,
  Shirt,
  Building,
  Building2,
  Hospital,
  Landmark,
  SquareParking,
  Key,
  Wrench,
  Droplets,
  Pill,
  Bus,
  TrainFront,
  TrainTrack,
  Leaf,
  FerrisWheel,
  Ambulance,
};

function getIcon(name: string) {
  return ICON_MAP[name] ?? Building;
}

interface Props {
  open: boolean;
  categories: FilterCategory[];
  filters: FilterItem[];
  activeFilter: string | null;
  onSelect: (filterId: string | null) => void;
  onClose: () => void;
}

export default function FilterModal({
  open,
  categories,
  filters,
  activeFilter,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />

      <View style={[s.sheet, { backgroundColor: theme.cardBg }]}>
        <View style={[s.handle, { backgroundColor: theme.subTextColor }]} />

        <View style={s.header}>
          <Text style={[s.title, { color: theme.textColor }]}>
            {t("Filter_modal_title")}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[s.closeBtn, { backgroundColor: theme.iconBg }]}
          >
            <X size={18} color={theme.subTextColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {categories.map((cat) => {
            const CatIcon = getIcon(cat.icon);
            const catFilters = filters.filter((f) => f.categoryId === cat.id);
            if (!catFilters.length) return null;

            return (
              <View key={cat.id} style={s.categorySection}>
                <View style={s.categoryHeader}>
                  <View
                    style={[
                      s.categoryIconWrap,
                      { backgroundColor: cat.color + "18" },
                    ]}
                  >
                    <CatIcon size={18} color={cat.color} />
                  </View>
                  <Text style={[s.categoryTitle, { color: cat.color }]}>
                    {t(cat.labelKey)}
                  </Text>
                </View>

                <View style={s.filterGrid}>
                  {catFilters.map((item) => {
                    const isActive = activeFilter === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          s.filterCard,
                          {
                            backgroundColor: isActive
                              ? cat.color
                              : theme.cardBgSecondary,
                            borderColor: cat.color,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          onSelect(isActive ? null : item.id);
                          onClose();
                        }}
                      >
                        <Text
                          style={[
                            s.filterLabel,
                            { color: isActive ? "#fff" : theme.textColor },
                          ]}
                          numberOfLines={1}
                        >
                          {t(item.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterCard: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterLabel: {
    fontSize: 13,
  },
});
