// ReportReasonSheet — reusable ActionSheet-style report reason picker
//
// A single, decoupled moderation surface reused by every place that can report
// content or a user (ProfileScreen, ActivityCard, GroupFeedCard, GroupChatTab).
// The sheet's only job is to collect a `ReportReason` and hand it back via
// `onSubmit`. It does NOT know what is being reported — the PARENT decides the
// `reportedUserId`/`contentType`/`contentId` and calls `friendService`/
// `useModeration.reportContent` inside its `onSubmit` handler. This keeps the
// component surface-agnostic so it can be dropped into any social screen.
//
// Feedback approach (design.md > "Confirmation & feedback flow"):
// The sheet manages its own submit lifecycle (idle → submitting → success |
// error) and renders inline feedback so every caller gets consistent messaging
// for free:
//   - success → "Thanks for reporting. We'll review this." then auto-closes
//   - failure → "Couldn't submit report. Please try again." (sheet stays open,
//     no state change, user can retry or dismiss)
// If a parent needs to react to success/failure (e.g. remove the item from the
// reporter's view) it does so inside `onSubmit`: resolving the promise signals
// success, throwing signals failure.
//
// All design values come from theme.ts (8pt grid, Montserrat, ≥48px touch
// targets, list-row recipe). CTA uses Colors.accent1; errors use Colors.error.
//
// _Requirements: 4.5, 4.6, 4.7, 5.1_

import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, Typography } from '../../constants/theme';
import { ReportReason } from '../../types/social';

const SUCCESS_MESSAGE = "Thanks for reporting. We'll review this.";
const ERROR_MESSAGE = "Couldn't submit report. Please try again.";

// How long the success confirmation stays visible before the sheet auto-closes.
const SUCCESS_AUTO_CLOSE_MS = 1200;

// Human-readable labels for the fixed ReportReason enum (design.md data model).
// Ordered least-to-most severe with "Something else" last (Hick's Law: a short,
// scannable, fixed list).
interface ReasonOption {
  reason: ReportReason;
  label: string;
}

const REASON_OPTIONS: ReadonlyArray<ReasonOption> = [
  { reason: 'harassment', label: 'Harassment or bullying' },
  { reason: 'spam', label: 'Spam' },
  { reason: 'inappropriate', label: 'Inappropriate content' },
  { reason: 'hate_speech', label: 'Hate speech' },
  { reason: 'impersonation', label: 'Impersonation' },
  { reason: 'other', label: 'Something else' },
];

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ReportReasonSheetProps {
  /** Controls sheet visibility. */
  visible: boolean;
  /** Called when the user dismisses the sheet (backdrop, cancel, or after success). */
  onClose: () => void;
  /**
   * Called with the selected reason when the user confirms. Return a promise:
   * resolving signals success (sheet shows the success message and auto-closes),
   * throwing/rejecting signals failure (sheet shows the error message and stays
   * open). The parent performs the actual report write (friendService /
   * useModeration.reportContent) here.
   */
  onSubmit: (reason: ReportReason) => Promise<void> | void;
  /** Optional sheet title. Defaults to "Report". */
  title?: string;
  /**
   * Optional human-readable label for what's being reported (e.g. a user's
   * name or "this post"). Shown as a subtitle for context.
   */
  subjectLabel?: string;
}

export default function ReportReasonSheet({
  visible,
  onClose,
  onSubmit,
  title = 'Report',
  subjectLabel,
}: ReportReasonSheetProps): React.JSX.Element {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [status, setStatus] = useState<SubmitStatus>('idle');

  // Reset local state whenever the sheet is (re)opened so a previous report's
  // selection/feedback never leaks into a new one.
  useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      setStatus('idle');
    }
  }, [visible]);

  // Auto-close shortly after a successful submit so the user sees the
  // confirmation, then the parent-controlled `visible` flips false.
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => {
      onClose();
    }, SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  const handleSelect = useCallback(
    (reason: ReportReason) => {
      if (isSubmitting || isSuccess) return;
      setSelectedReason(reason);
      // Clear a prior error once the user re-engages.
      setStatus('idle');
    },
    [isSubmitting, isSuccess]
  );

  const handleConfirm = useCallback(async () => {
    if (selectedReason === null || isSubmitting || isSuccess) return;
    setStatus('submitting');
    try {
      await onSubmit(selectedReason);
      setStatus('success');
    } catch {
      // No state change on failure (design: R4.7) — just surface the error and
      // let the user retry or dismiss.
      setStatus('error');
    }
  }, [selectedReason, isSubmitting, isSuccess, onSubmit]);

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return; // don't allow dismiss mid-write
    onClose();
  }, [isSubmitting, onClose]);

  const confirmDisabled = selectedReason === null || isSubmitting || isSuccess;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleRequestClose}>
      {/* Backdrop — tap outside the sheet to dismiss */}
      <Pressable
        style={styles.backdrop}
        onPress={handleRequestClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss report sheet"
      />

      <SafeAreaView style={styles.sheetWrapper} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subjectLabel ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subjectLabel}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={handleRequestClose}
              style={styles.closeButton}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="close" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            // Success confirmation replaces the picker before auto-close.
            <View style={styles.successContainer} accessibilityLiveRegion="polite">
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.successText}>{SUCCESS_MESSAGE}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.prompt}>Why are you reporting this?</Text>

              {/* Reason options — standard list-row recipe */}
              <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
                {REASON_OPTIONS.map((option) => {
                  const selected = selectedReason === option.reason;
                  return (
                    <TouchableOpacity
                      key={option.reason}
                      style={styles.optionRow}
                      onPress={() => handleSelect(option.reason)}
                      disabled={isSubmitting}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.label}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={selected ? Colors.accent1 : Colors.gray.medium}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {status === 'error' ? (
                <Text style={styles.errorText} accessibilityLiveRegion="polite">
                  {ERROR_MESSAGE}
                </Text>
              ) : null}

              {/* Confirm CTA — separated from the option rows */}
              <TouchableOpacity
                style={[styles.confirmButton, confirmDisabled && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={confirmDisabled}
                accessibilityRole="button"
                accessibilityLabel="Submit report"
              >
                <Text style={styles.confirmButtonText}>
                  {isSubmitting ? 'Submitting…' : 'Submit report'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: Spacing.comfortable, // 24
    paddingTop: Spacing.base, // 16
    paddingBottom: Spacing.base, // 16
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.base, // 16
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.base, // 16
  },
  title: {
    fontSize: Typography.fontSize.heading, // 24
    fontWeight: Typography.fontWeight.bold, // '700'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: Typography.fontSize.caption, // 14
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,
  },
  closeButton: {
    width: 48, // touch target ≥ 48px
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Spacing.tight, // pull up to align with title
    marginRight: -Spacing.tight,
  },
  prompt: {
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.semibold, // '600'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.tight, // 8
  },
  optionsScroll: {
    // Cap height so a long list stays scrollable within the sheet on small
    // screens; six rows fit comfortably below this on most devices.
    maxHeight: 336, // 8 × 42 (≈ six 56px rows)
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base, // 16
    minHeight: 56, // 8 × 7 (touch target / list recipe)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light, // #E8E8E8
  },
  optionLabel: {
    flex: 1,
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.regular,
    marginRight: Spacing.base, // 16
  },
  errorText: {
    marginTop: Spacing.base, // 16
    fontSize: Typography.fontSize.caption, // 14
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.error, // #FF4444
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  confirmButton: {
    minHeight: 56, // 8 × 7 (primary CTA)
    borderRadius: 12,
    backgroundColor: Colors.accent1, // #B771E5
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.comfortable, // 24
    marginTop: Spacing.comfortable, // 24 — separate CTA from option rows
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.bold, // '700'
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.loose, // 32
  },
  successText: {
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.semibold, // '600'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
    marginTop: Spacing.base, // 16
  },
});
