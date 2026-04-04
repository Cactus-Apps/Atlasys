// Version 1.3.6 - © Cactus Apps 2026
import { t } from "i18next";
import { Pause, Play, TimerIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "@/lib/theme";

function Timer() {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isRunning) {
      const interval = 10;
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + interval);
      }, interval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };

  const formatTime = (ms: any) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    return (
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}:` +
      `${milliseconds.toString().padStart(2, "0")}`
    );
  };

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.time}> {t('Timer')} </Text>
        <Text style={styles.timetime}>{formatTime(time)}</Text>
        <View>
          <View
            style={{
              flexDirection: "row",
              marginTop: 10,
            }}
          >
            {!isRunning && (
              <TouchableOpacity style={styles.button} onPress={startTimer}>
                <Play strokeWidth={3} color={theme.textColor} />
              </TouchableOpacity>
            )}
            {isRunning && (
              <TouchableOpacity style={styles.button} onPress={stopTimer}>
                <Pause strokeWidth={3} color={theme.textColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.buttonReset} onPress={resetTimer}>
              <Text style={styles.buttonText}>{t('Reset')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View>
        <TimerIcon
          style={{ left: 158, top: 22, position: "absolute" }}
          color="#22C55E"
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
    button: {
      marginHorizontal: 5,
      alignItems: "center",
    },
    buttonReset: {
      marginHorizontal: 5,
      alignItems: "center",
      marginLeft: 20,
    },
    buttonText: {
      color: textColor,
      fontSize: 16,
      fontWeight: '500',
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
  });
};

export default Timer;
