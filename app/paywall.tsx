import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuthStore } from "@/lib/storage/zustand";
import { useEffect } from "react";
import { router, Router } from "expo-router";

export default function PaywallScreen() {
  const { user } = useAuth();
  const setSubscribed = useAuthStore((s) => s.setSubscribed);
  const isSubscribed = useAuthStore((s) => s.isSubscribed);

  const handleSubscribe = async () => {
    console.log("User bezahlt...");

    // Simuliere Zahlung
    setTimeout(() => {
      setSubscribed(true); // setzt den State auf true
      console.log("User ist jetzt Premium"); // hier direkt true ausgeben
    }, 1500);
    router.navigate("/onboarding");
  };

  useEffect(() => {
    if (isSubscribed) {
      console.log("🎉 Premium Features freigeschaltet!");
      // hier z.B. UI freischalten oder Premium API Calls erlauben
    }
  }, [isSubscribed]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌟 Premium erforderlich</Text>

      {!user && (
        <Text style={styles.text}>Bitte melde dich an, um fortzufahren.</Text>
      )}

      {user && (
        <>
          <Text style={styles.text}>
            Schalte alle Funktionen frei für 4.99€/Monat
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
            <Text style={styles.buttonText}>Jetzt freischalten</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  text: { textAlign: "center", marginBottom: 20 },
  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
  },
  buttonText: { color: "white", fontWeight: "700" },
});
