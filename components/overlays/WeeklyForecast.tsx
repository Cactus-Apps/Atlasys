import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useAppTheme } from "@/lib/theme";
import { getWeatherIcon, getWeekdayLabel } from "./weatherCodeMap";
import type { WeatherState } from "@/lib/hooks/useWeatherForecast";

type Props = {
  weather: WeatherState | null;
};

export default function WeeklyForecast({ weather }: Props) {
  const theme = useAppTheme();

  if (!weather?.daily?.length) return null;

  const data = weather.daily.slice(0, 7);

  return (
    <FlatList
      horizontal
      data={data}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyExtractor={(item: any) => item.date}
      renderItem={({ item: day, index }: any) => {
        const label = getWeekdayLabel(day.date, index);
        return (
          <View
            style={[
              styles.day,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              },
            ]}
          >
            <Text style={[styles.dayLabel, { color: theme.subTextColor }]}>
              {label}
            </Text>
            {getWeatherIcon(day.code)}
            <Text style={[styles.tempMax, { color: theme.textColor }]}>
              {day.tempMax}°
            </Text>
            <Text style={[styles.tempMin, { color: theme.subTextColor }]}>
              {day.tempMin}°
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  day: {
    width: 60,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  tempMax: {
    fontSize: 14,
    fontWeight: "600",
  },
  tempMin: {
    fontSize: 12,
  },
});
