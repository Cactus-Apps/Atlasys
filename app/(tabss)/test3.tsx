import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface test3Props {}

const test3 = (props: test3Props) => {
  return (
    <View style={styles.container}>
      <Text>test3</Text>
    </View>
  );
};

export default test3;

const styles = StyleSheet.create({
  container: {}
});
