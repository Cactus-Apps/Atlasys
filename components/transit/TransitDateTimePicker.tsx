import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";

interface Props {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onApply: (date: Date) => void;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export default function TransitDateTimePicker({
  visible,
  value,
  onClose,
  onApply,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const s = getStyles(theme);
  const locale = i18n.language || "en";

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(value));
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const [cursor, setCursor] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const today = startOfDay(new Date());

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(2024, 0, 1 + index)),
    );
  }, [locale]);

  const monthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(cursor);
    } catch {
      return "";
    }
  }, [cursor, locale]);

  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: (number | null)[] = Array.from(
      { length: firstWeekday },
      () => null,
    );

    for (let day = 1; day <= daysInMonth; day++) items.push(day);
    while (items.length % 7 !== 0) items.push(null);

    const rows: (number | null)[][] = [];
    for (let index = 0; index < items.length; index += 7) {
      rows.push(items.slice(index, index + 7));
    }
    return rows;
  }, [cursor]);

  const canGoPrev =
    cursor.getFullYear() > today.getFullYear() ||
    (cursor.getFullYear() === today.getFullYear() &&
      cursor.getMonth() > today.getMonth());

  const apply = () => {
    const next = new Date(selectedDay);
    next.setHours(hour, minute, 0, 0);
    const minimum = new Date(Date.now() + 60_000);
    onApply(next.getTime() < minimum.getTime() ? minimum : next);
  };

  const setNow = () => {
    const now = new Date();
    setSelectedDay(startOfDay(now));
    setHour(now.getHours());
    setMinute(now.getMinutes());
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const renderStepper = (
    label: string,
    current: number,
    onUp: () => void,
    onDown: () => void,
  ) => (
    <View style={s.stepper}>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={onUp}
        accessibilityLabel={`${label} +`}
      >
        <ChevronUp size={18} color={theme.textColor} />
      </TouchableOpacity>
      <Text style={s.stepperValue}>{pad(current)}</Text>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={onDown}
        accessibilityLabel={`${label} -`}
      >
        <ChevronDown size={18} color={theme.textColor} />
      </TouchableOpacity>
      <Text style={s.stepperLabel}>{label}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            s.card,
            { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
          ]}
        >
          <View style={s.header}>
            <Text style={s.title}>{t("Route_transit_depart_at")}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color={theme.subTextColor} />
            </TouchableOpacity>
          </View>

          <View style={s.monthRow}>
            <TouchableOpacity
              disabled={!canGoPrev}
              onPress={() => setCursor(addMonths(cursor, -1))}
              style={[s.navBtn, !canGoPrev && s.disabled]}
            >
              <ChevronLeft size={18} color={theme.textColor} />
            </TouchableOpacity>
            <Text style={s.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => setCursor(addMonths(cursor, 1))}
              style={s.navBtn}
            >
              <ChevronRight size={18} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <View style={s.weekRow}>
            {weekdays.map((day, index) => (
              <Text key={`${day}-${index}`} style={s.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={s.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={s.week}>
                {week.map((day, dayIndex) => {
                  const key = `day-${weekIndex}-${dayIndex}`;
                  if (day === null) {
                    return <View key={key} style={s.dayCell} />;
                  }

                  const date = new Date(
                    cursor.getFullYear(),
                    cursor.getMonth(),
                    day,
                  );
                  const disabled = date.getTime() < today.getTime();
                  const active = sameDay(date, selectedDay);
                  const isToday = sameDay(date, today);

                  return (
                    <TouchableOpacity
                      key={key}
                      disabled={disabled}
                      onPress={() => setSelectedDay(date)}
                      style={[s.dayCell, disabled && s.disabled]}
                    >
                      <View style={[s.dayBadge, active && s.dayBadgeActive]}>
                        <Text
                          style={[
                            s.dayText,
                            isToday && !active && s.dayTextToday,
                            active && s.dayTextActive,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={s.divider} />

          <View style={s.timeHeader}>
            <Text style={s.label}>{t("Route_transit_time_picker")}</Text>
            <TouchableOpacity onPress={setNow}>
              <Text style={s.nowBtn}>{t("Route_transit_now")}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.timeRow}>
            {renderStepper(
              t("Route_transit_hours"),
              hour,
              () => setHour((prev) => (prev + 1) % 24),
              () => setHour((prev) => (prev + 23) % 24),
            )}
            <Text style={s.colon}>:</Text>
            {renderStepper(
              t("Route_transit_minutes"),
              minute,
              () => setMinute((prev) => (prev + 1) % 60),
              () => setMinute((prev) => (prev + 59) % 60),
            )}
          </View>

          <View style={s.footer}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelText}>{t("Route_transit_cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={apply}
              style={[s.applyBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={s.applyText}>{t("Route_transit_apply")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { cardBgSecondary, textColor, subTextColor, borderColor, isModern } =
    theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
      padding: 20,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      borderRadius: isModern ? 24 : 18,
      borderWidth: 1,
      padding: 18,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    title: { fontSize: 18, fontFamily: fonts.bold, color: textColor },
    closeBtn: {
      backgroundColor: cardBgSecondary,
      borderRadius: 16,
      padding: 6,
    },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    navBtn: {
      backgroundColor: cardBgSecondary,
      borderRadius: 14,
      padding: 6,
    },
    monthLabel: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    weekRow: { flexDirection: "row", marginBottom: 4 },
    weekday: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      fontFamily: fonts.semibold,
      color: subTextColor,
    },
    grid: { marginTop: 2 },
    week: { flexDirection: "row" },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    dayBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    dayBadgeActive: { backgroundColor: theme.primary },
    dayText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: textColor,
      textAlign: "center",
      lineHeight: 18,
      includeFontPadding: false,
    },
    dayTextToday: { color: theme.primary, fontFamily: fonts.bold },
    dayTextActive: { color: theme.white, fontFamily: fonts.bold },
    disabled: { opacity: 0.28 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: borderColor,
      marginVertical: 14,
    },
    timeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    label: { fontSize: 13, fontFamily: fonts.semibold, color: subTextColor },
    nowBtn: { fontSize: 13, fontFamily: fonts.bold, color: theme.primary },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    stepper: { alignItems: "center", minWidth: 86 },
    stepBtn: {
      paddingVertical: 6,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: cardBgSecondary,
    },
    stepperValue: {
      fontSize: 26,
      fontFamily: fonts.bold,
      color: textColor,
      marginVertical: 2,
      fontVariant: ["tabular-nums"],
    },
    stepperLabel: { fontSize: 11, color: subTextColor, marginTop: 2 },
    colon: { fontSize: 26, fontFamily: fonts.bold, color: textColor },
    footer: { flexDirection: "row", gap: 10, marginTop: 18 },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: cardBgSecondary,
    },
    cancelText: { fontSize: 14, fontFamily: fonts.semibold, color: textColor },
    applyBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
    },
    applyText: { fontSize: 14, fontFamily: fonts.bold, color: theme.white },
  });
};
