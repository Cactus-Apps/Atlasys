import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const account = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sie sind nicht angemeldet.</Text>
      <Text>Anmelden noch nicht möglich.</Text>
      <Text>Erst im nächsten Update.</Text>
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
