import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = '@cards_order_v1';

const initialCards = [
  { id: '1', title: 'Karte A', description: 'Beschreibung A' },
  { id: '2', title: 'Karte B', description: 'Beschreibung B' },
  { id: '3', title: 'Karte C', description: 'Beschreibung C' },
  { id: '4', title: 'Karte D', description: 'Beschreibung D' },
];

export default function ReorderableCardsScreen() {
  const [data, setData] = useState(initialCards);
  const [loading, setLoading] = useState(true);

  // Lade gespeicherte Reihenfolge aus AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Validierung: ids matchen initialCards (optional)
          setData(parsed);
        }
      } catch (e) {
        console.warn('Fehler beim Laden der gespeicherten Reihenfolge', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Speichere Reihenfolge
  const persistOrder = useCallback(async (newOrder: typeof initialCards) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Fehler beim Speichern der Reihenfolge', e);
    }
  }, []);

  // Wird aufgerufen, wenn Drag beendet ist
  const handleDragEnd = useCallback(
    ({ data: newData }: { data: typeof initialCards }) => {
      setData(newData);
      persistOrder(newData);
    },
    [persistOrder]
  );

  type Card = { id: string; title: string; description: string };

  const renderItem = useCallback(
    ({
      item,
      index,
      drag,
      isActive,
    }: {
      item: Card;
      index?: number;
      drag: () => void;
      isActive: boolean;
    }) => {
      return (
        <GestureHandlerRootView>
        <ScaleDecorator>
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={drag} 
            disabled={isActive}
            style={[
              styles.card,
              { transform: [{ scale: isActive ? 1.02 : 1 }], elevation: isActive ? 6 : 2 },
            ]}
          >
            <View style={styles.cardLeft}>
              <View style={styles.handle}>
                <Text style={styles.handleText}>☰</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        </ScaleDecorator>
        </GestureHandlerRootView>
      );
    },
    []
  );

  const resetOrder = useCallback(async () => {
    Alert.alert('Zurücksetzen', 'Willst du die Original-Reihenfolge wiederherstellen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ja',
        onPress: async () => {
          setData(initialCards);
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
          } catch (e) {
            console.warn('Fehler beim Entfernen', e);
          }
        },
      },
    ]);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Lädt…</Text>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meine Karten</Text>
        <TouchableOpacity onPress={resetOrder} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <DraggableFlatList
        data={data}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        activationDistance={20} // kurze Verzögerung bis drag startet (optional)
        containerStyle={{ paddingHorizontal: 16 }}
      />
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  resetBtn: { padding: 8 },
  resetText: { color: '#007aff' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: { marginRight: 10 },
  handle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f1f3f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleText: { fontSize: 18, color: '#666' },

  cardBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666' },
});