import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function FeedbackScreen() {
  const [height, setHeight] = useState(40);

  return (
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Help & Feedback</Text>
          <View style={styles.card2}>
            <Text style={{color: '#FAFAFA',fontWeight: 'bold', fontSize: 23}}>Subscribe to our newsletter</Text>
            <Text style={{color: '#969696', fontSize: 16}}>Enter your details to receive updates and tips</Text>
            <TextInput
              multiline
              placeholderTextColor="#A2A2A2"
              placeholder="Write here..."
              style={[styles.textInput, { height: Math.max(40, height) }]}
              onContentSizeChange={(event) => {
                setHeight(event.nativeEvent.contentSize.height);
              }}
            />
          </View>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#146275",
  },
  cardDescription: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
  card2: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0A0A0A',
  },
  textInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: '#111111',
    color: "#000",
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    textAlignVertical: "top",
  },
});
