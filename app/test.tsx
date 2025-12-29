import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


import { Linking } from "react-native";

const DonateButton = () => {
  const donateUrl = "https://www.buymeacoffee.com/deinprofil";

  const handlePress = async () => {
    const supported = await Linking.canOpenURL(donateUrl);
    if (supported) {
      await Linking.openURL(donateUrl);
    } else {
      alert("Spendenlink kann nicht geöffnet werden.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <LinearGradient
          colors={["#FF6A00", "#FFB347"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.buttonText}>Support us with a donation</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};


export default function App() {
  
  
  return (
    <View style={{ padding: 20 }}>
      <View style={styles.view}>
        <TouchableOpacity style={styles.buttonSkip}>
          <Text style={styles.skip}> Skip </Text>
        </TouchableOpacity>
        <LottieView
          source={require("../assets/animations/secure.json")}
          style={{ width: 330, height: 330 }}
          autoPlay
          loop
        />
        <View style={{ paddingVertical: 80 }} />
        <Text style={styles.textklein}>
          We respect your privacy
        </Text>
        <View style={{ paddingVertical: 50 }} />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}> Next </Text>
        </TouchableOpacity>
        <DonateButton /> 
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  button: {
    borderRadius: 14,
    borderColor: "#466483ff",
    backgroundColor: "#466483ff",
    paddingHorizontal: 80,
    paddingVertical: 7,
  },
  view: {
    justifyContent: "center",
    alignItems: "center",
  },
  textklein: {
    fontSize: 19,
    fontWeight: "400",
    color: "#fff",
  },
  skip: {
    fontSize: 16,
    fontWeight: "400",
    color: "#949393ff",
  },
  buttonSkip: {
    alignSelf: 'flex-end',
    paddingRight: 20,
  },
  container: {
    marginVertical: 20,
    alignItems: "center",
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: "#FF6A00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
