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
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { Button, SimpleInput } from '../components/common';
import { LoginForm } from '../types';
import { trackScreen, trackEvent } from '../services/enhancedAnalyticsService';
import ConsentControl from '../components/auth/ConsentControl';
import ProviderButtons from '../components/auth/ProviderButtons';
import { SsoError, type SsoProviderId } from '../services/ssoService';
import { getSsoErrorDisplay } from '../utils/ssoErrorMessage';

// Completes the Google auth-session redirect when the app is brought back to
// the foreground after the browser-based OAuth flow. Must run at module scope,
// before the component renders (Expo AuthSession requirement).
WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn, signInWithApple, signInWithGoogle, ssoAvailability } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);

  // SSO consent gate + in-flight provider tracking (R2.1, R2.2).
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<SsoProviderId | null>(null);
  // Progressive disclosure: the email/password form is revealed only when the
  // user picks "Sign In with Email" from the provider chooser.
  const [showEmailForm, setShowEmailForm] = useState(false);

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

  // Shared error presentation for both SSO providers. Cancellations are silent
  // (getSsoErrorDisplay returns silent); everything else surfaces an Alert with
  // the mapped title/message (collision, network, timeout, generic — R7, R3, R4).
  const presentSsoError = (error: unknown) => {
    if (error instanceof SsoError) {
      const display = getSsoErrorDisplay(error);
      if (display.silent) {
        return;
      }
      Alert.alert(display.title ?? 'Sign In Failed', display.message);
      return;
    }
    // Non-SsoError: fall back to a generic message so nothing leaks unhandled.
    Alert.alert('Sign In Failed', 'Authentication failed, please try again.');
  };

  const handleApple = async () => {
    setLoadingProvider('apple.com');
    try {
      await signInWithApple();
      // Navigation is handled by the auth state change.
    } catch (error) {
      presentSsoError(error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogle = async () => {
    setLoadingProvider('google.com');
    try {
      await signInWithGoogle();
      // Navigation is handled by the auth state change.
    } catch (error) {
      presentSsoError(error);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Tapping an SSO button before accepting Terms/Privacy shows a dismissible
  // prompt and never starts auth (R2.5).
  const handleBlockedPress = () => {
    Alert.alert(
      'Accept the Terms first',
      'Please accept the Terms of Service and Privacy Policy before continuing.'
    );
  };

  // SSO is an iOS-only surface, and only when at least one provider is available
  // (R1.4, R1.5). When it's visible we lead with the provider chooser and reveal
  // the email/password form on demand (progressive disclosure); when it's not,
  // the email form is the only method, so it's shown directly.
  const ssoVisible =
    Platform.OS === 'ios' && (ssoAvailability.apple || ssoAvailability.google);
  const showChooser = ssoVisible && !showEmailForm;

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
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to Goalfer</Text>
            <Text style={styles.subtitle}>Sign in to keep your streak going</Text>
          </View>

          {showChooser ? (
            /*
              Provider chooser (iOS + at least one provider). Apple sits above
              Google (R1.2); the consent checkbox gates both SSO buttons (R2).
              "Sign In with Email" reveals the email/password form in place.
            */
            <View style={styles.chooser}>
              <ProviderButtons
                consentAccepted={consentAccepted}
                availability={ssoAvailability}
                loadingProvider={loadingProvider}
                onApple={handleApple}
                onGoogle={handleGoogle}
                onBlockedPress={handleBlockedPress}
              />

              <ConsentControl checked={consentAccepted} onChange={setConsentAccepted} />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.emailButton}
                onPress={() => setShowEmailForm(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Sign in with email"
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.white}
                  style={styles.emailButtonIcon}
                />
                <Text style={styles.emailButtonText}>Sign In with Email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /*
              Email/password form. Revealed on demand after the user picks "Sign
              In with Email", and shown directly whenever SSO isn't available
              (e.g. Android) so email remains a first-class path (R1.4).
            */
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
                title="Sign In"
                onPress={handleSignIn}
                loading={isLoading}
                variant="primary"
                size="lg"
              />

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {ssoVisible && (
                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => setShowEmailForm(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign-in options"
                >
                  <Ionicons name="chevron-back" size={16} color={Colors.primaryText} />
                  <Text style={styles.backLinkText}>Other sign-in options</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
  logo: {
    width: 96,                      // 8 * 12 (larger for brand presence)
    height: 96,                     // 8 * 12
    marginBottom: 24,               // 8 * 3 (comfortable)
  },
  title: {
    fontSize: 24,                   // heading
    fontWeight: '700',              // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    marginBottom: 8,                // 8 * 1 (tight)
  },
  subtitle: {
    fontSize: 16,                   // body
    fontFamily: Typography.fontFamily.regular,
    color: Colors.accent2,
    textAlign: 'center',
    lineHeight: 24,                 // 1.5 line height
  },
  form: {
    marginBottom: 32,               // 8 * 4 (loose)
  },
  chooser: {
    marginBottom: 32,               // 8 * 4 (loose)
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,             // 8 * 3 (comfortable) — space above & below
  },
  emailButton: {
    width: '100%',
    minHeight: 56,                  // 8 * 7 (primary touch target)
    paddingVertical: 16,            // 8 * 2 (base)
    paddingHorizontal: 24,          // 8 * 3 (comfortable)
    borderRadius: 32,               // pill, matches the SSO buttons
    backgroundColor: Colors.accent1, // purple CTA (#B771E5)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonIcon: {
    marginRight: 8,                 // 8 * 1 (tight) icon-label pair
  },
  emailButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,                   // body
    fontWeight: '600',              // semibold
    color: Colors.white,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,                  // 8 * 2 (base)
    minHeight: 44,                  // touch target
    paddingVertical: 8,             // 8 * 1 (tight)
  },
  backLinkText: {
    fontSize: 16,                   // body
    color: Colors.primaryText,
    fontWeight: '500',              // medium
    fontFamily: Typography.fontFamily.medium,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,                   // caption
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.dark,
    marginHorizontal: 16,           // 8 * 2 (base)
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
    fontFamily: Typography.fontFamily.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,                  // 8 * 2 (base)
  },
  footerText: {
    fontSize: 16,                   // body
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.dark,
  },
  signUpLink: {
    fontSize: 16,                   // body
    color: Colors.accent1,
    fontWeight: '600',              // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
});
