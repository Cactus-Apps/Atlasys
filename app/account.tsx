import { useRouter } from "expo-router";
import { t } from "i18next";
import {
  ChevronLeft
} from "lucide-react-native";
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import "./i18n.js";



const account = () => {
  const router = useRouter();

  return (
    <SafeAreaView>
    <TouchableOpacity style={styles.placeholder} onPress={() => router.navigate("/profilescreen")}>
      <ChevronLeft />
    </TouchableOpacity>
    <View style={styles.container}>
      <Text style={styles.text}>{t('not_signed_in')}</Text>
      <Text>{t('signing_in_not_ready')}.</Text>
      <Text>{t('in the next update')}</Text>
    </View>
    </SafeAreaView>
    
  );
};

export default account ;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 23
  },
  placeholder: {
    marginTop: 20,
    marginLeft: 23,
  },
});
