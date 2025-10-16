import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { trackEvent } from '../../services/enhancedAnalyticsService';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  trigger?: 'rating_prompt' | 'manual' | 'bug_report' | 'feature_request';
}

interface FeedbackData {
  rating: number;
  category: FeedbackCategory;
  description: string;
  email?: string;
  includeDeviceInfo: boolean;
}

type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'praise' | 'other';

const feedbackCategories = [
  { id: 'bug' as FeedbackCategory, label: 'Bug Report', icon: 'bug', color: '#FF6B6B' },
  { id: 'feature' as FeedbackCategory, label: 'Feature Request', icon: 'bulb', color: '#4ECDC4' },
  { id: 'improvement' as FeedbackCategory, label: 'Improvement', icon: 'trending-up', color: '#45B7D1' },
  { id: 'praise' as FeedbackCategory, label: 'Praise', icon: 'heart', color: '#96CEB4' },
  { id: 'other' as FeedbackCategory, label: 'Other', icon: 'chatbubble', color: '#FFEAA7' },
];

export default function FeedbackModal({ visible, onClose, onSubmit, trigger = 'manual' }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>('improvement');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(() => {
    return rating > 0 && description.trim().length >= 10;
  }, [rating, description]);

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (rating === 0) {
        Alert.alert('Rating Required', 'Please provide a rating before submitting.');
      } else if (description.trim().length < 10) {
        Alert.alert('Description Too Short', 'Please provide more details about your feedback.');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        rating,
        category,
        description: description.trim(),
        email: email.trim() || undefined,
        includeDeviceInfo,
      };

      // Track feedback submission
      trackEvent('feedback_submitted', {
        rating,
        category,
        trigger,
        has_email: !!email.trim(),
        description_length: description.trim().length,
      });

      onSubmit(feedbackData);
      
      // Reset form
      setRating(0);
      setCategory('improvement');
      setDescription('');
      setEmail('');
      setIncludeDeviceInfo(true);
      
      onClose();
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted. We appreciate your input and will review it carefully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your feedback. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>How would you rate your experience?</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : Colors.gray.light}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingText}>
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </Text>
      )}
    </View>
  );

  const renderCategorySelection = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryLabel}>What type of feedback is this?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {feedbackCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              category === cat.id && styles.categoryButtonSelected,
              { borderColor: cat.color },
              category === cat.id && { backgroundColor: cat.color + '20' },
            ]}
            onPress={() => setCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={category === cat.id ? cat.color : Colors.gray.medium}
            />
            <Text
              style={[
                styles.categoryButtonText,
                category === cat.id && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View entering={SlideInUp} style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Share Your Feedback</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.gray.medium} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {renderStarRating()}
              {renderCategorySelection()}

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Tell us more</Text>
                <TextInput
                  style={styles.descriptionInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Please describe your feedback in detail..."
                  placeholderTextColor={Colors.gray.medium}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.emailContainer}>
                <Text style={styles.emailLabel}>Email (optional)</Text>
                <TextInput
                  style={styles.emailInput}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.gray.medium}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.emailHint}>
                  We'll only use this to follow up on your feedback
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deviceInfoContainer}
                onPress={() => setIncludeDeviceInfo(!includeDeviceInfo)}
              >
                <Ionicons
                  name={includeDeviceInfo ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={Colors.accent1}
                />
                <Text style={styles.deviceInfoText}>
                  Include device information to help us debug issues
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isFormValid && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || !isFormValid}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  title: {
    ...Typography.h3,
    color: Colors.primaryText,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ratingLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.gray.medium,
  },
  categoryContainer: {
    marginBottom: Spacing.xl,
  },
  categoryLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  categoryButtonSelected: {
    borderWidth: 2,
  },
  categoryButtonText: {
    ...Typography.caption,
    color: Colors.gray.medium,
    marginLeft: Spacing.xs,
  },
  descriptionContainer: {
    marginBottom: Spacing.lg,
  },
  descriptionLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.primaryText,
    minHeight: 100,
  },
  emailContainer: {
    marginBottom: Spacing.lg,
  },
  emailLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.primaryText,
  },
  emailHint: {
    ...Typography.caption,
    color: Colors.gray.medium,
    marginTop: Spacing.xs,
  },
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  deviceInfoText: {
    ...Typography.caption,
    color: Colors.gray.dark,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.gray.medium,
  },
  submitButton: {
    backgroundColor: Colors.accent1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray.light,
  },
  submitButtonText: {
    ...Typography.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});