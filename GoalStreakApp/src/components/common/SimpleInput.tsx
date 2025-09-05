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
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.lg,
    color: Colors.primaryText,
    minHeight: 50,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
