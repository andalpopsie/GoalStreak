import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { InputProps } from '../types';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  disabled = false,
  multiline = false,
  ...props
}: InputProps & any) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showPassword = secureTextEntry && !isPasswordVisible;
  const showPasswordToggle = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focused,
        error && styles.error,
        disabled && styles.disabled,
        multiline && styles.multiline,
      ]}>
        <TextInput
          style={[
            styles.input, 
            showPasswordToggle && styles.inputWithIcon,
            multiline && styles.multilineInput
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray.medium}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={showPassword}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.gray.medium}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  multiline: {
    alignItems: 'flex-start',
    minHeight: 80,
  },
  focused: {
    borderColor: Colors.accent1,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  error: {
    borderColor: Colors.error,
  },
  disabled: {
    backgroundColor: Colors.gray.light,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    paddingVertical: Spacing.md,
  },
  multilineInput: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  inputWithIcon: {
    paddingRight: Spacing.sm,
  },
  passwordToggle: {
    padding: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
