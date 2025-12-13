import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";


import { Linking } from "react-native";

const DonateButton = () => {
  const donateUrl = "https://www.buymeacoffee.com/deinprofil"; // Hier deinen Spendenlink einfügen

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
          <Text style={styles.buttonText}>☕ Unterstütze uns mit einer Spende</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};


export default function App() {
  const [address, setAddress] = useState("");
  
  const getAddressFromCoordinates = async () => {
    const latitude = 48.51296;
    const longitude = 2.17402;
    
    try {
      const response = await fetch(
        "https://address-from-to-latitude-longitude.p.rapidapi.com/location",
        {
          method: "POST", // oder GET, je nach API-Dokumentation
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key":
              "6380233280msh3c40a7c4cf22d9ep1b667djsn3cba13e921e0",
            "X-RapidAPI-Host":
              "address-from-to-latitude-longitude.p.rapidapi.com",
          },
          body: JSON.stringify({
            latitude: latitude,
            longitude: longitude,
          }),
        }
      );

      const data = await response.json();
      setAddress(data.address || "Adresse nicht gefunden");
    } catch (error) {
      setAddress("Fehler beim Abrufen der Adresse");
      console.error(error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Adresse abrufen" onPress={getAddressFromCoordinates} />
      <Text style={{ color: "#fff" }}>Adresse: {address}</Text>
      <View style={styles.view}>
        <TouchableOpacity style={styles.buttonSkip}>
          <Text style={styles.skip}> Überspringen </Text>
        </TouchableOpacity>
        <LottieView
          source={require("../assets/animations/secure.json")}
          style={{ width: 330, height: 330 }}
          autoPlay
          loop
        />
        <View style={{ paddingVertical: 80 }} />
        <Text style={styles.textklein}>
          {" "}
          Wir respektieren deine Privatsfähre
        </Text>
        <View style={{ paddingVertical: 50 }} />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}> Weiter </Text>
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
