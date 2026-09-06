// FeedbackModal — Star rating + text feedback, saves to Firestore
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Colors, Typography } from '../../constants/theme';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  source?: 'profile' | 'milestone' | 'prompt';
}

const STAR_LABELS = ['', 'Needs Work', 'Okay', 'Good', 'Great', 'Love It!'];

export default function FeedbackModal({
  visible,
  onClose,
  userId,
  userName,
  source = 'profile',
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please tap a star to rate your experience.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: userId || 'anonymous',
        userName: userName || 'Anonymous',
        rating,
        text: feedbackText.trim() || null,
        source,
        createdAt: serverTimestamp(),
        appVersion: '1.0.0',
        platform: Platform.OS,
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state after closing
    setTimeout(() => {
      setRating(0);
      setFeedbackText('');
      setSubmitted(false);
    }, 300);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          {submitted ? (
            /* ── Thank You State ── */
            <View style={styles.thankYou}>
              <View style={styles.thankYouIcon}>
                <Ionicons name="heart" size={40} color={Colors.accent1} />
              </View>
              <Text style={styles.thankYouTitle}>Thank you! 💜</Text>
              <Text style={styles.thankYouText}>
                Your feedback helps us make Goalfer better for everyone.
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Feedback Form ── */
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={styles.title}>How's your experience?</Text>
              <Text style={styles.subtitle}>We'd love to hear what you think of Goalfer</Text>

              {/* Star Rating */}
              <View style={styles.starsSection}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                      accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#FFD700' : Colors.gray.medium}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && <Text style={styles.starLabel}>{STAR_LABELS[rating]}</Text>}
              </View>

              {/* Text Feedback */}
              <TextInput
                style={styles.textInput}
                placeholder="What could we improve? Any features you'd love to see?"
                placeholderTextColor={Colors.secondaryText}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{feedbackText.length}/500</Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>Not Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                >
                  <Ionicons name="send" size={16} color={Colors.white} />
                  <Text style={styles.submitText}>
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24, // 8 × 3 (comfortable)
    paddingBottom: 40, // safe area
  },
  handleBar: {
    width: 40, // 8 × 5
    height: 4,
    backgroundColor: Colors.gray.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, // 8 × 1.5
    marginBottom: 24, // 8 × 3 (comfortable)
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 24, // heading
    fontWeight: '700', // bold
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 16, // body
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24, // 8 × 3 (comfortable)
  },
  // Stars
  starsSection: {
    alignItems: 'center',
    marginBottom: 24, // 8 × 3 (comfortable)
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8, // 8 × 1 (tight)
  },
  starButton: {
    padding: 4,
    minWidth: 48, // 8 × 6 (touch target)
    minHeight: 48, // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  starLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14, // caption
    fontWeight: '600', // semibold
    color: Colors.accent1,
    marginTop: 8, // 8 × 1 (tight)
  },
  // Text input
  textInput: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 16, // body
    color: Colors.primaryText,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16, // 8 × 2 (base)
    minHeight: 100, // ~4 lines
    maxHeight: 160,
    lineHeight: 22,
    marginBottom: 4,
  },
  charCount: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12, // small
    color: Colors.secondaryText,
    textAlign: 'right',
    marginBottom: 24, // 8 × 3 (comfortable)
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12, // 8 × 1.5
    marginBottom: 8, // 8 × 1 (tight)
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20, // 8 × 2.5
    borderRadius: 24, // pill
    backgroundColor: Colors.gray.light,
    minHeight: 48, // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16, // body
    fontWeight: '500', // medium
    color: Colors.secondaryText,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // 8 × 1 (tight)
    paddingVertical: 14,
    borderRadius: 24, // pill
    backgroundColor: Colors.accent1,
    minHeight: 48, // 8 × 6 (touch target)
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray.medium,
  },
  submitText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16, // body
    fontWeight: '600', // semibold
    color: Colors.white,
  },
  // Thank you state
  thankYou: {
    alignItems: 'center',
    paddingVertical: 32, // 8 × 4 (loose)
  },
  thankYouIcon: {
    width: 80, // 8 × 10
    height: 80, // 8 × 10
    borderRadius: 40,
    backgroundColor: Colors.accent1 + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // 8 × 2 (base)
  },
  thankYouTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 24,
    fontWeight: '700', // bold
    color: Colors.primaryText,
    marginBottom: 8, // 8 × 1 (tight)
  },
  thankYouText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24, // 8 × 3 (comfortable)
    paddingHorizontal: 16, // 8 × 2 (base)
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 48, // 8 × 6
    borderRadius: 24, // pill
    backgroundColor: Colors.accent1,
    minHeight: 48, // 8 × 6 (touch target)
  },
  doneButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16, // body
    fontWeight: '600', // semibold
    color: Colors.white,
  },
});
