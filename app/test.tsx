import React from 'react';
import { Button, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Success Toast"
        onPress={() =>
          Toast.show({
            type: 'success',
            text1: 'Alles gut!',
            text2: 'Das hat funktioniert ✅',
          })
        }
      />

      <Button
        title="Error Toast"
        color="red"
        onPress={() =>
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Please enter more than one letter',
            position: 'top',
          })
        }
      />

      <Button
        title="Info Toast"
        color="blue"
        onPress={() =>
          Toast.show({
            type: 'info',
            text1: 'Hinweis',
            text2: 'Das ist eine Info-Nachricht ℹ️',
          })
        }
      />

      <Toast />
    </View>
  );
}