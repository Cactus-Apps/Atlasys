import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface indexProps {}

const index = (props: indexProps) => {
  return (
    <View style={styles.container}>
      <Text>index</Text>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {}
});
