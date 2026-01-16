import React, { JSX, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { router } from "expo-router";
import { setOnboardingCompleted } from "@/lib/storage/storage";

const { width } = Dimensions.get("window");

type Slide = {
  id: string;
  content: JSX.Element;
};

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleFinish = async () => {
    await setOnboardingCompleted();
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    await setOnboardingCompleted();
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Überspringen</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>{item.content}</View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          ))}
        </View>

        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleFinish}>
            <Text style={styles.buttonText}>Fertig</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={goToNext}>
            <Text style={styles.buttonText}>Weiter</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slideContent: {
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: "#007AFF",
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#007AFF",
    width: 10,
    height: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

const slides: Slide[] = [
  {
    id: "1",
    content: (
      <View style={styles.slideContent}>
        <Text style={styles.title}>Willkommen 👋</Text>
        <Text style={styles.text}>Das ist dein erstes Onboarding-Slide.</Text>
      </View>
    ),
  },
  {
    id: "2",
    content: (
      <View style={styles.slideContent}>
        <Text style={styles.title}>Features entdecken 🚀</Text>
        <Text style={styles.text}>
          Hier könntest du Icons, Bilder oder Komponenten einfügen.
        </Text>
      </View>
    ),
  },
  {
    id: "3",
    content: (
      <View style={styles.slideContent}>
        <Text style={styles.title}>Los geht’s 🎉</Text>
        <Text style={styles.text}>Du bist bereit, die App zu nutzen!</Text>
      </View>
    ),
  },
];
