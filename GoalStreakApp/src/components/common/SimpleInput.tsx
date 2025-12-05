import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface SimpleInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function SimpleInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: SimpleInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray.medium}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,               // 8 * 2 (base spacing)
  },
  label: {
    fontSize: 16,                   // body
    fontWeight: '600',              // semibold
    color: Colors.primaryText,
    marginBottom: 8,                // 8 * 1 (tight)
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    borderRadius: 12,               // 8 * 1.5
    paddingHorizontal: 16,          // 8 * 2
    paddingVertical: 16,            // 8 * 2
    fontSize: 16,                   // body
    color: Colors.primaryText,
    minHeight: 56,                  // 8 * 7 (good touch target)
  },
  multilineInput: {
    minHeight: 96,                  // 8 * 12
    paddingTop: 16,                 // 8 * 2
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 14,                   // caption
    color: Colors.error,
    marginTop: 8,                   // 8 * 1 (tight)
  },
});
