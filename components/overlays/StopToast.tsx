import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";

interface StopToastProps {
  stopName: string;
  colour: string;
  duration?: number;
  onClose: () => void;
}

export function StopToast({
  stopName,
  colour,
  duration,
  onClose,
}: StopToastProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const [animValue] = useState(() => new Animated.Value(1));
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    animValue.setValue(1);

    const animation = Animated.timing(animValue, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) onCloseRef.current?.();
    });

    return () => animation.stop();
  }, [duration, animValue]);

  const timerWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.toast, { backgroundColor: theme.cardBg }]}>
        <View style={[styles.colourBar, { backgroundColor: colour }]} />
        <View style={styles.textField}>
          <Text style={styles.SubName} numberOfLines={1}>
            Station
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {stopName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color={theme.subTextColor} />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.timerBar,
            { width: timerWidth, backgroundColor: colour },
          ]}
        />
      </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      top: 100,
      left: 16,
      right: 16,
      zIndex: 1000,
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 20,
      paddingRight: 16,
      paddingVertical: 14,
      borderRadius: 12,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    colourBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
    },
    textField: {
      flex: 1,
      flexDirection: "column",
      marginRight: 12,
    },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textColor,
    },
    SubName: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.subTextColor,
    },
    timerBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      height: 3,
    },
  });
};
