import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect } from 'react';

type Props = {
  onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: Props) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1.1, { duration: 900 });
    opacity.value = withTiming(
      0,
      { duration: 600 },
      (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/icon.png')}
        style={[styles.logo, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
