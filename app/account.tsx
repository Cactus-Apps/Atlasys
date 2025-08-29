import { t } from "i18next";
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import "./i18n.js";


const account = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('not_signed_in')}</Text>
      <Text>{t('signing_in_not_ready')}.</Text>
      <Text>{t('in the next update')}</Text>
    </View>
    
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
  }
});
