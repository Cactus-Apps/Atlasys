import { t } from "i18next";
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import "./i18n.js";

const account = () => {

  return (
    <SafeAreaView>
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
    alignItems: 'center',
    flexBasis: 'auto',
  },
  text: {
    fontSize: 23
  },
});
