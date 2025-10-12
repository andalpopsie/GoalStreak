import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/common';
import { SignUpForm } from '../types';
import { openPrivacyPolicy, openTermsOfService } from '../utils/linkingUtils';
import { trackScreen, trackEvent, trackConversion } from '../services/enhancedAnalyticsService';

interface SignUpScreenProps {
  navigation: any;
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { signUp } = useAuth();
  const [form, setForm] = useState<SignUpForm>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Partial<SignUpForm>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Track screen view
  useEffect(() => {
    trackScreen('SignUpScreen', { source: 'app_navigation' });
    trackEvent('signup_screen_viewed', {
      source: 'app_navigation'
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<SignUpForm> = {};

    if (!form.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (form.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      // Track validation error
      trackEvent('signup_validation_error', {
        errors: Object.keys(errors),
        form_completion: {
          has_name: !!form.displayName.trim(),
          has_email: !!form.email.trim(),
          has_password: !!form.password,
          has_confirm_password: !!form.confirmPassword
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      // Track signup attempt
      trackEvent('signup_started', {
        email_domain: form.email.split('@')[1],
        name_length: form.displayName.trim().length
      });

      await signUp(form.email.trim(), form.password, form.displayName.trim());
      
      // Track successful signup
      trackConversion('first_open', 1, {
        userId: form.email, // Will be updated with actual user ID later
        source: 'app_signup'
      });
      
      trackEvent('signup_completed', {
        email_domain: form.email.split('@')[1],
        name_length: form.displayName.trim().length
      });
      
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      // Track signup error
      trackEvent('signup_error', {
        error_message: error.message,
        email_domain: form.email.split('@')[1]
      });
      
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="person-add" size={48} color={Colors.accent1} />
            </View>
            <Text style={styles.title}>Join GoalStreak</Text>
            <Text style={styles.subtitle}>Start building healthy habits today</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={form.displayName}
              onChangeText={(displayName: string) => setForm({ ...form, displayName })}
              autoCapitalize="words"
              autoComplete="name"
              error={errors.displayName}
              returnKeyType="next"
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(email: string) => setForm({ ...form, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              returnKeyType="next"
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={form.password}
              onChangeText={(password: string) => setForm({ ...form, password })}
              secureTextEntry
              autoComplete="new-password"
              error={errors.password}
              returnKeyType="next"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChangeText={(confirmPassword: string) => setForm({ ...form, confirmPassword })}
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword}
              returnKeyType="done"
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={isLoading}
                variant="primary"
                size="lg"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <TouchableOpacity onPress={openTermsOfService} style={styles.linkContainer}>
                <Text style={styles.termsLink}>Terms of Service</Text>
              </TouchableOpacity>
              {' '}and{' '}
              <TouchableOpacity onPress={openPrivacyPolicy} style={styles.linkContainer}>
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl, // Extra padding at bottom
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.accent2,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
  },
  signInLink: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent1,
    fontWeight: Typography.fontWeight.semibold,
  },
  terms: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl, // Extra margin at bottom
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  linkContainer: {
    // Inline display for text links
  },
  termsLink: {
    color: Colors.accent1,
    fontWeight: Typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
});
