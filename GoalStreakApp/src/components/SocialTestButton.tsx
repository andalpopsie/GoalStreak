// Social Test Button - Add this to any screen for testing
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { SocialTestSetup } from '../utils/socialTestSetup';
import { Colors } from '../constants/theme';

export default function SocialTestButton() {
  
  const handleSetupTestData = async () => {
    try {
      Alert.alert(
        'Setup Test Data',
        'This will create test users and social data. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Setup', 
            onPress: async () => {
              await SocialTestSetup.setupBasicTestData();
              Alert.alert('Success!', 'Test data created. Check console for details.');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to setup test data');
      console.error(error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleSetupTestData}>
      <Text style={styles.buttonText}>🧪 Setup Social Test Data</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
