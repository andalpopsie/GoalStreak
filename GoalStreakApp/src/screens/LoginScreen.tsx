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
import { Button, SimpleInput } from '../components/common';
import { LoginForm } from '../types';
import { trackScreen, trackEvent } from '../services/enhancedAnalyticsService';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Track screen view
  useEffect(() => {
    trackScreen('LoginScreen', { source: 'app_navigation' });
    trackEvent('login_screen_viewed', {
      source: 'app_navigation'
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      // Track validation error
      trackEvent('login_validation_error', {
        errors: Object.keys(errors),
        form_completion: {
          has_email: !!form.email.trim(),
          has_password: !!form.password
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      // Track login attempt
      trackEvent('login_started', {
        email_domain: form.email.split('@')[1]
      });

      await signIn(form.email.trim(), form.password);
      
      // Track successful login
      trackEvent('login_completed', {
        email_domain: form.email.split('@')[1]
      });
      
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      // Track login error
      trackEvent('login_error', {
        error_message: error.message,
        email_domain: form.email.split('@')[1]
      });
      
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="trending-up" size={48} color={Colors.accent1} />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your streak</Text>
          </View>

          <View style={styles.form}>
            <SimpleInput
              placeholder="Username or Email"
              value={form.email}
              onChangeText={(email) => setForm({ ...form, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <SimpleInput
              placeholder="Password"
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
              secureTextEntry
              error={errors.password}
            />

            <Button
              title="Submit"
              onPress={handleSignIn}
              loading={isLoading}
              variant="primary"
              size="lg"
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,               // 8 * 6 (spacious)
  },
  logoContainer: {
    width: 80,                      // 8 * 10
    height: 80,                     // 8 * 10
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,               // 8 * 3 (comfortable)
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 32,               // 8 * 4 (loose)
  },
  forgotPassword: {
    alignSelf: 'center',            // Centered (modern pattern)
    marginTop: 16,                  // 8 * 2 (base)
    minHeight: 44,                  // Touch target
    justifyContent: 'center',
    paddingVertical: 8,             // 8 * 1 (easier to tap)
  },
  forgotPasswordText: {
    fontSize: 16,                   // body (readable, interactive text)
    color: Colors.primaryText,      // Darker, more subtle
    fontWeight: '500',              // medium
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,                  // 8 * 2 (base)
  },
  footerText: {
    fontSize: 16,                   // body
    color: Colors.gray.dark,
  },
  signUpLink: {
    fontSize: 16,                   // body
    color: Colors.accent1,
    fontWeight: '600',              // semibold
  },
});
