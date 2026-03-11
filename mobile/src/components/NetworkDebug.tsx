import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import api from '@api/client';

const BASE_URL = 'http://129.146.186.180';

export const NetworkDebug: React.FC = () => {
  const [status, setStatus] = useState<string>('Tap to test');
  const [color, setColor] = useState<string>('#888');

  const runTest = async () => {
    setStatus('Testing...');
    setColor('#FFA500');

    const results: string[] = [];

    try {
      const startFetch = Date.now();
      const resFetch = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const elapsedFetch = Date.now() - startFetch;
      const textFetch = await resFetch.text();
      results.push(
        `✅ Health (fetch): ${resFetch.status} (${elapsedFetch}ms)\n${textFetch.substring(0, 100)}`
      );
    } catch (e: any) {
      results.push(`❌ Health (fetch): ${e?.message ?? String(e)}`);
    }

    try {
      const startAxios = Date.now();
      const resAxios = await api.get('/health', { validateStatus: () => true });
      const elapsedAxios = Date.now() - startAxios;
      const dataStr =
        typeof resAxios.data === 'string'
          ? resAxios.data
          : JSON.stringify(resAxios.data);
      results.push(
        `✅ Health (axios): ${resAxios.status} (${elapsedAxios}ms)\n${dataStr.substring(0, 100)}`
      );
    } catch (e: any) {
      results.push(`❌ Health (axios): ${e?.message ?? String(e)}`);
    }

    const allOk = results.every((r) => r.startsWith('✅'));
    setColor(allOk ? '#00CC44' : '#FF3333');
    setStatus(results.join('\n\n'));
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Network Debug</Text>
      <Text style={styles.url}>{BASE_URL}</Text>
      <TouchableOpacity style={styles.btn} onPress={runTest}>
        <Text style={styles.btnText}>Run Test</Text>
      </TouchableOpacity>
      <Text style={[styles.status, { color }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    margin: 16,
  },
  title: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  url: { color: '#AAA', fontSize: 12, marginBottom: 12 },
  btn: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  btnText: { color: '#FFF', textAlign: 'center' },
  status: { fontSize: 12, fontFamily: 'Courier', lineHeight: 18 },
});
