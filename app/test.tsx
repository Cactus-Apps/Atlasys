import LottieView from "lottie-react-native";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
});
