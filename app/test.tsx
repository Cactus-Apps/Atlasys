import { useState } from 'react';
import { Host, AlertDialog, Button } from '@expo/ui/jetpack-compose';

export default function BasicAlertDialogExample() {
  const [visible, setVisible] = useState(false);

  return (
    <Host matchContents>
      <Button onPress={() => setVisible(true)}>Show Alert</Button>
      <AlertDialog
        visible={visible}
        title="Confirm Action"
        text="Are you sure you want to proceed?"
        confirmButtonText="Confirm"
        dismissButtonText="Cancel"
        onConfirmPressed={() => {
          console.log('Confirmed');
          setVisible(false);
        }}
        onDismissPressed={() => {
          console.log('Dismissed');
          setVisible(false);
        }}
      />
    </Host>
  );
}
