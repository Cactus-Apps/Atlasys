import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type RequestInfo = {
  requestId: string;
  email: string;
  userId: string;
  status: 'pending' | 'verified' | 'completed' | string;
  createdAt: string;
  expiresAt: string;
  verifiedAt?: string | null;
  completedAt?: string | null;
};

// ------------------------------------------------------------------
// CONFIG: setze BASE_URL auf deine Server-URL (ohne trailing slash)
// z.B. const BASE_URL = 'https://dein-host.example.com'
// Du kannst das hier auch aus env/config ziehen
// ------------------------------------------------------------------
const BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const Path = process.env.EXPO_PUBLIC_PATH;

export default function AdminPanel() {
  const [requestId, setRequestId] = useState('');
  const [code, setCode] = useState('');
  const [adminToken, setAdminToken] = useState(''); // Optional: Falls dein Server Admin-Token erwartet
  const [loading, setLoading] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [requestData, setRequestData] = useState<RequestInfo | null>(null);

  async function safeFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (adminToken) {
      headers['X-Admin-Token'] = adminToken;
    }
    const res = await fetch(`${BASE_URL}${Path}`, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let json: any = null;
    if (contentType.includes('application/json')) {
      try { json = JSON.parse(text); } catch (e) { json = null; }
    }
    return { ok: res.ok, status: res.status, json, text };
  }

  async function handleLoadRequest() {
    if (!requestId.trim()) {
      Alert.alert('Bitte Request ID eingeben');
      return;
    }
    setLoading(true);
    setRequestData(null);
    try {
      const payload = { requestId: requestId.trim() };
      const { ok, status, json, text } = await safeFetch('/request-info', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!ok) {
        const msg = json?.message || json?.error || text || `Fehler ${status}`;
        Alert.alert('Fehler beim Laden', String(msg));
        setLoading(false);
        return;
      }
      if (!json?.success || !json?.data) {
        Alert.alert('Keine Daten', 'Server hat keine Request-Daten zurückgegeben.');
        setLoading(false);
        return;
      }
      setRequestData(json.data as RequestInfo);
    } catch (err: any) {
      console.error('load request error', err);
      Alert.alert('Fehler', err?.message || 'Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!requestId.trim() || !code.trim()) {
      Alert.alert('Bitte Request ID und Code eingeben');
      return;
    }
    setLoadingVerify(true);
    try {
      const body = { requestId: requestId.trim(), code: code.trim() };
      const { ok, status, json, text } = await safeFetch('/verify-delete', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!ok) {
        const msg = json?.message || json?.error || text || `Fehler ${status}`;
        Alert.alert('Verifikation fehlgeschlagen', String(msg));
        setLoadingVerify(false);
        return;
      }
      const message = json?.message || 'Code validiert';
      Alert.alert('Erfolg', String(message));
      if (requestData?.requestId === requestId.trim()) {
        await handleLoadRequest();
      }
    } catch (err: any) {
      console.error('verify error', err);
      Alert.alert('Fehler', err?.message || 'Netzwerkfehler');
    } finally {
      setLoadingVerify(false);
    }
  }

  function formatDate(iso?: string | null) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Admin Panel — Account Lösch-Requests</Text>

        <Text style={styles.label}>Admin Token (optional)</Text>
        <TextInput
          value={adminToken}
          onChangeText={setAdminToken}
          placeholder="X-Admin-Token (nicht in Code speichern)"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Admin Token"
        />

        <Text style={styles.label}>Request ID</Text>
        <TextInput
          value={requestId}
          onChangeText={setRequestId}
          placeholder="z. B. 123e4567-e89b-12d3-a456-426614174000"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Request ID"
        />

        <View style={styles.row}>
          <View style={styles.buttonWrap}>
            <Button title="Request laden" onPress={handleLoadRequest} disabled={loading} />
          </View>

          <View style={styles.buttonWrap}>
            {loading ? <ActivityIndicator /> : null}
          </View>
        </View>

        <View style={{ height: 16 }} />

        <Text style={styles.label}>Bestätigungscode</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="6-stelliger Code"
          style={styles.input}
          keyboardType="number-pad"
          autoCapitalize="none"
          accessibilityLabel="Bestätigungscode"
        />

        <View style={styles.row}>
          <View style={styles.buttonWrap}>
            <Button title="Code verifizieren" onPress={handleVerifyCode} disabled={loadingVerify} />
          </View>
          <View style={styles.buttonWrap}>
            {loadingVerify ? <ActivityIndicator /> : null}
          </View>
        </View>

        <View style={{ height: 24 }} />

        <Text style={styles.subHeader}>Request Details</Text>

        {loading ? (
          <ActivityIndicator />
        ) : requestData ? (
          <View style={styles.card}>
            <Text style={styles.field}><Text style={styles.bold}>ID:</Text> {requestData.requestId}</Text>
            <Text style={styles.field}><Text style={styles.bold}>E-Mail:</Text> {requestData.email}</Text>
            <Text style={styles.field}><Text style={styles.bold}>User ID:</Text> {requestData.userId}</Text>
            <Text style={styles.field}><Text style={styles.bold}>Status:</Text> {requestData.status}</Text>
            <Text style={styles.field}><Text style={styles.bold}>Erstellt:</Text> {formatDate(requestData.createdAt)}</Text>
            <Text style={styles.field}><Text style={styles.bold}>Läuft ab:</Text> {formatDate(requestData.expiresAt)}</Text>
            {requestData.verifiedAt ? <Text style={styles.field}><Text style={styles.bold}>Verifiziert:</Text> {formatDate(requestData.verifiedAt)}</Text> : null}
            {requestData.completedAt ? <Text style={styles.field}><Text style={styles.bold}>Abgeschlossen:</Text> {formatDate(requestData.completedAt)}</Text> : null}
          </View>
        ) : (
          <Text style={styles.muted}>Keine Request geladen. Klicke auf „Request laden“ oder verifiziere direkt mit ID+Code.</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonWrap: {
    flex: 1,
    marginRight: 8,
  },
  card: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    borderRadius: 10,
  },
  field: {
    marginBottom: 6,
    fontSize: 14,
  },
  bold: {
    fontWeight: '700',
  },
  muted: {
    color: '#666',
    fontStyle: 'italic',
  },
});