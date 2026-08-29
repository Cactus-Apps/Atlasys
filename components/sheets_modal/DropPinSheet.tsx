import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X, MapPin, Save, Trash2, Route } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import { reverseGeocode } from "@/lib/geocoding/geocoding";
import {
  PLACE_CATEGORIES,
  PLACE_SUB_CATEGORIES,
} from "@/lib/geocoding/places_categories";

const ALL_CATEGORIES = [...PLACE_CATEGORIES, ...PLACE_SUB_CATEGORIES] as const;

const ICON_PICKER = ALL_CATEGORIES.filter((c) => c.key !== "other");

export const placeCategoryColor = (key?: string) =>
  ALL_CATEGORIES.find((c) => c.key === key)?.color ?? "#64748B";

export const placeCategoryLabel = (
  key: string | null,
  t: (key: string) => string,
) => {
  const cat = ALL_CATEGORIES.find((c) => c.key === key);
  return cat ? t(cat.labelKey) : t("Place_cat_other");
};

export type PinData = {
  id?: string;
  name?: string;
  category?: string;
  customCategory?: string;
  categoryIcon?: string;
  latitude: number;
  longitude: number;
};

interface Props {
  sheetRef: React.RefObject<BottomSheet | null>;
  mode: "create" | "view";
  pin: PinData | null;
  snapPoints: string[];
  onSave: (data: {
    name: string;
    category: string;
    customCategory?: string;
    categoryIcon?: string;
  }) => void;
  onDelete: (id: string) => void;
  onRoute: (lat: number, lon: number, name: string) => void;
  onClose: () => void;
}

export default function DropPinSheet({
  sheetRef,
  mode,
  pin,
  snapPoints,
  onSave,
  onDelete,
  onRoute,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const [address, setAddress] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subOpen, setSubOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);

  useEffect(() => {
    if (!pin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddress(null);
    setSubOpen(false);
    if (mode === "view") {
      setName(pin.name ?? "");
      setCategory(pin.category || null);
      setCustomCategory(pin.category === "custom" ? pin.customCategory ?? "" : "");
      setCategoryIcon(pin.category === "custom" ? pin.categoryIcon ?? null : null);
    } else {
      setName("");
      setCategory(null);
      setCustomCategory("");
      setCategoryIcon(null);
    }

    let cancelled = false;
    reverseGeocode(
      pin.latitude,
      pin.longitude,
      undefined,
      i18n.language || "en",
    ).then((a) => {
      if (!cancelled) setAddress(a);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.id, pin?.latitude, pin?.longitude, mode]);

  const handleSave = () => {
    if (!pin) return;
    const finalName = name.trim() || address || t("Place_default_name");
    const isCustom = category === "custom";

    if (isCustom) {
      if (!categoryIcon) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave({
        name: finalName,
        category: "custom",
        customCategory: customCategory.trim(),
        categoryIcon,
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ name: finalName, category: category ?? "" });
  };

  const selectedCat = ALL_CATEGORIES.find((c) => c.key === category);
  const selectedIcon = ALL_CATEGORIES.find((c) => c.key === categoryIcon);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      onChange={(i) => {
        if (i === -1) onClose();
      }}
      backgroundStyle={{
        borderTopLeftRadius: theme.isModern ? 32 : 24,
        borderTopRightRadius: theme.isModern ? 32 : 24,
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subTextColor, width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {!pin ? (
          <View style={{ height: 160 }} />
        ) : (
          <>
            {/* ── Header ── */}
            <View style={s.header}>
              <View style={s.headerIcon}>
                <MapPin size={22} color={theme.primary} />
              </View>
              <Text style={[s.title, { color: theme.textColor }]}>
                {mode === "create"
                  ? t("Place_add_title")
                  : pin.name || t("Place_default_name")}
              </Text>
              <TouchableOpacity
                onPress={() => sheetRef.current?.close()}
                style={[s.closeBtn, { backgroundColor: theme.cardBgSecondary }]}
              >
                <X size={18} color={theme.subTextColor} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {mode === "view" &&
              (category ? selectedIcon || selectedCat : null) && (
                <View style={[s.badgeRow, { paddingHorizontal: 20 }]}>
                  <View
                    style={[
                      s.badge,
                      {
                        backgroundColor:
                          (selectedIcon?.color ??
                            selectedCat?.color ??
                            "#64748B") + "20",
                      },
                    ]}
                  >
                    {(() => {
                      const Icon = selectedIcon?.icon ?? selectedCat?.icon;
                      const badgeColor =
                        selectedIcon?.color ??
                        selectedCat?.color ??
                        "#64748B";
                      return (
                        <>
                          {Icon && <Icon size={14} color={badgeColor} />}
                          <Text style={[s.badgeText, { color: badgeColor }]}>
                            {category === "custom"
                              ? customCategory || t("Place_cat_other")
                              : placeCategoryLabel(category, t)}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                </View>
              )}

            {/* ── Address ── */}
            <View style={s.addressRow}>
              <MapPin size={16} color={theme.subTextColor} />
              {address ? (
                <Text
                  style={[s.addressText, { color: theme.subTextColor }]}
                  numberOfLines={2}
                >
                  {address}
                </Text>
              ) : (
                <ActivityIndicator size="small" color={theme.primary} />
              )}
            </View>
            <Text style={[s.coords, { color: theme.chevronColor }]}>
              {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </Text>

            {mode === "create" ? (
              <>
                {/* ── Category chips ── */}
                <Text style={[s.label, { color: theme.subTextColor }]}>
                  {t("Place_label_category")}
                </Text>
                <View style={s.chips}>
                  {PLACE_CATEGORIES.map((cat) => {
                    const isOther = cat.key === "other";
                    const active = isOther ? subOpen : cat.key === category;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (isOther) {
                            const next = !subOpen;
                            setSubOpen(next);
                            if (next) {
                              setCategory("custom");
                            } else {
                              setCategory(category === "custom" ? null : category);
                            }
                          } else {
                            setCategory(cat.key);
                            setSubOpen(false);
                          }
                        }}
                        style={[
                          s.chip,
                          {
                            backgroundColor: active
                              ? cat.color + "22"
                              : theme.cardBgSecondary,
                            borderColor: active ? cat.color : theme.borderColor,
                          },
                        ]}
                      >
                        <cat.icon
                          size={16}
                          color={active ? cat.color : theme.textColor}
                        />
                        <Text
                          style={[
                            s.chipText,
                            {
                              color: active ? cat.color : theme.textColor,
                              fontFamily: active
                                ? fonts.semibold
                                : fonts.medium,
                            },
                          ]}
                        >
                          {t(cat.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {subOpen && (
                  <>
                    <Text style={[s.subLabel, { color: theme.subTextColor }]}>
                      {t("Place_label_other")}
                    </Text>

                    <Text style={[s.fieldLabel, { color: theme.subTextColor }]}>
                      {t("Place_custom_label")}
                    </Text>
                    <TextInput
                      value={customCategory}
                      onChangeText={setCustomCategory}
                      placeholder={t("Place_custom_label_placeholder")}
                      placeholderTextColor={theme.chevronColor}
                      cursorColor={theme.accentColor}
                      style={[
                        s.input,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.textColor,
                          borderColor: theme.borderColor,
                        },
                      ]}
                    />

                    <Text style={[s.fieldLabel, { color: theme.subTextColor }]}>
                      {t("Place_custom_icon")}
                    </Text>
                    <View style={s.iconGrid}>
                      {ICON_PICKER.map((ic) => {
                        const active = ic.key === categoryIcon;
                        return (
                          <TouchableOpacity
                            key={ic.key}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCategoryIcon(ic.key);
                            }}
                            style={[
                              s.iconCell,
                              {
                                backgroundColor: active
                                  ? ic.color + "22"
                                  : theme.cardBgSecondary,
                                borderColor: active ? ic.color : theme.borderColor,
                              },
                            ]}
                          >
                            <ic.icon size={22} color={ic.color} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {!categoryIcon && (
                      <Text style={[s.hint, { color: theme.danger }]}>
                        {t("Place_custom_icon_required")}
                      </Text>
                    )}
                  </>
                )}

                {/* ── Name input ── */}
                <Text style={[s.label, { color: theme.subTextColor }]}>
                  {t("Place_label_name")}
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={address || t("Place_name_placeholder")}
                  placeholderTextColor={theme.chevronColor}
                  cursorColor={theme.accentColor}
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={handleSave}
                  style={[s.saveBtn, { backgroundColor: theme.primary }]}
                >
                  <Save size={20} color="#fff" />
                  <Text style={s.saveBtnText}>{t("Place_save")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.actions}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onRoute(pin.latitude, pin.longitude, pin.name || "");
                      sheetRef.current?.close();
                    }}
                    style={[s.routeBtn, { backgroundColor: theme.primary }]}
                  >
                    <Route size={20} color="#fff" />
                    <Text style={s.routeBtnText}>{t("Poi_start_route")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (pin.id) onDelete(pin.id);
                      sheetRef.current?.close();
                    }}
                    style={[
                      s.deleteBtn,
                      { backgroundColor: theme.dangerLight },
                    ]}
                  >
                    <Trash2 size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
    minHeight: 22,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    lineHeight: 20,
  },
  coords: {
    fontSize: 12,
    fontFamily: fonts.medium,
    paddingHorizontal: 44,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
  },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
  },
  input: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 10,
    alignItems: "center",
  },
  routeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  routeBtnText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
