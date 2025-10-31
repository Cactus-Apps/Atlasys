import RequestDeleteByEmail from '@/components/requestdelete';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';


const deleteAccount = () => {
  return (
    <View style={styles.container}>
        <RequestDeleteByEmail />
    </View>
  );
};

export default deleteAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
