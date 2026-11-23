import React from 'react';
import { StyleSheet, Text } from 'react-native';

export const DeveloperCredits = () => (
  <Text style={styles.credits}>Desenvolvido por Há! Rede e Pulso</Text>
);

const styles = StyleSheet.create({
  credits: { textAlign: 'center', fontSize: 10, color: '#667363', paddingTop: 24, paddingBottom: 12 },
});
