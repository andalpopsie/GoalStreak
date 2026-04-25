import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { Button, SimpleInput } from '../components/common';
import { SignUpForm } from '../types';
import { openPrivacyPolicy, openTermsOfService } from '../utils/linkingUtils';
import { trackScreen, trackEvent, trackConversion } from '../services/enhancedAnalyticsService';
import { validatePassword } from '../utils/inputValidation';

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
    } else {
      const passwordValidation = validatePassword(form.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
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
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Join GoalStreak</Text>
            <Text style={styles.subtitle}>Start building healthy habits today</Text>
          </View>

          <View style={styles.form}>
            <SimpleInput
              placeholder="Full Name"
              value={form.displayName}
              onChangeText={(displayName: string) => setForm({ ...form, displayName })}
              autoCapitalize="words"
              error={errors.displayName}
            />

            <SimpleInput
              placeholder="Email"
              value={form.email}
              onChangeText={(email: string) => setForm({ ...form, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <SimpleInput
              placeholder="Password"
              value={form.password}
              onChangeText={(password: string) => setForm({ ...form, password })}
              secureTextEntry
              error={errors.password}
            />

            <SimpleInput
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChangeText={(confirmPassword: string) => setForm({ ...form, confirmPassword })}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              variant="primary"
              size="lg"
            />
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
    padding: 16,                    // 8 * 2 (base spacing)
    paddingBottom: 32,              // 8 * 4 (loose)
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,               // 8 * 4 (loose)
    paddingTop: 16,                 // 8 * 2 (base)
  },
  logo: {
    width: 96,                      // 8 * 12 (larger for brand presence)
    height: 96,                     // 8 * 12
    marginBottom: 24,               // 8 * 3 (comfortable)
  },
  title: {
    fontSize: 24,                   // heading
    fontWeight: '700',              // bold
    color: Colors.primaryText,
    marginBottom: 8,                // 8 * 1 (tight)
  },
  subtitle: {
    fontSize: 16,                   // body
    color: Colors.accent2,
    textAlign: 'center',
    lineHeight: 24,                 // 1.5 line height
  },
  form: {
    marginBottom: 24,               // 8 * 3 (comfortable)
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,               // 8 * 3 (comfortable)
  },
  footerText: {
    fontSize: 16,                   // body
    color: Colors.gray.dark,
  },
  signInLink: {
    fontSize: 16,                   // body
    color: Colors.accent1,
    fontWeight: '600',              // semibold
  },
  terms: {
    paddingHorizontal: 16,          // 8 * 2 (base)
    marginBottom: 32,               // 8 * 4 (loose)
  },
  termsText: {
    fontSize: 14,                   // caption
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: 22,                 // ~1.6 line height
  },
  linkContainer: {
    // Inline display for text links
  },
  termsLink: {
    color: Colors.accent1,
    fontWeight: '500',              // medium
    textDecorationLine: 'underline',
  },
});
