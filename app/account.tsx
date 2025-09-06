import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import "./i18n.js";

const account = () => {
  const router = useRouter();
  const {signOut} = useAuth();

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <TouchableOpacity style={styles.signin} onPress={() => router.replace("/auth")}>
            <Text>Sign Up</Text>
        </TouchableOpacity>
          <Button mode="text" onPress={signOut} icon={"logout"}> Sign Out</Button>
      </View>
    </SafeAreaView>
  );
};

export default account;

const styles = StyleSheet.create({
  container: {
  },
  signin: {
    paddingLeft: 50,
    padding: 40,
  }
});
