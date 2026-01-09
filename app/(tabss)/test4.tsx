import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface test4Props {}

const test4 = (props: test4Props) => {
  return (
    <View style={styles.container}>
      <Text>test4</Text>
    </View>
  );
};

export default test4;

const styles = StyleSheet.create({
  container: {}
});
