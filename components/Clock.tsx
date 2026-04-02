// Version 1.3.6 - © Cactus Apps 2026
import { t } from "i18next";
import {
  Clock4
} from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppTheme } from "@/lib/theme";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;


function Clock() {
  const [time, setTime] = useState(new Date());
  const theme = useAppTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.time}> {t('Time')}</Text>
        <Text style={styles.timetime}>
          {""}
          {time.toLocaleTimeString()}
        </Text>
        <Text style={styles.timezone}> {timezone}</Text>
      </View>
      <View>
        <Clock4
          style={{ marginLeft: 158, marginTop: 22 }}
          color="#3B82F6"
          strokeWidth={3}
          size={36}
        />
      </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { cardBg, borderColor, textColor, subTextColor, isModern } = theme;

  return StyleSheet.create({
    card: {
      borderColor: borderColor,
      backgroundColor: cardBg,
      borderRadius: isModern ? 24 : 16,
      borderWidth: 1,
      width: 340,
      height: 120,
      elevation: 1,
      marginVertical: 12,
      paddingVertical: 13,
      paddingHorizontal: 13,
      flexDirection: "row",
    },
    time: {
      color: subTextColor,
      fontSize: 18,
      fontWeight: "500",
    },
    timetime: {
      color: textColor,
      fontSize: 26,
      fontWeight: "700",
    },
    timezone: {
      color: subTextColor,
      fontSize: 17,
      fontWeight: "500",
    },
  });
};

export default Clock;
