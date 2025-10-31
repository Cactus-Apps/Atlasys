import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>{time.toLocaleTimeString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
});
