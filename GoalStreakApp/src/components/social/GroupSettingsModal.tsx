// GroupSettingsModal Component - Admin: edit/end group. Member: leave group.
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';
import { Group } from '../../types/social';
import groupService from '../../services/groupService';

interface GroupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
  isAdmin: boolean;
  onUpdateGroup: (updates: Partial<Pick<Group, 'name' | 'description' | 'endDate'>>) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onEndGroup: () => Promise<void>;
}

export default function GroupSettingsModal({
  visible,
  onClose,
  group,
  isAdmin,
  onUpdateGroup,
  onRemoveMember,
  onLeaveGroup,
  onEndGroup,
}: GroupSettingsModalProps) {
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description);
  const [hasEndDate, setHasEndDate] = useState(!!group.endDate);
  const [editEndDate, setEditEndDate] = useState<Date>(
    group.endDate || new Date(Date.now() + 30 * 86400000)
  );
  const [isSaving, setIsSaving] = useState(false);

  // Validation
  const nameValidation = editName.length > 0 ? groupService.validateGroupName(editName) : null;
  const descValidation = editDescription.length > 0 ? groupService.validateGroupDescription(editDescription) : null;
  const endDateValidation = hasEndDate ? groupService.validateEndDate(editEndDate) : null;

  const hasChanges =
    editName.trim() !== group.name ||
    editDescription.trim() !== group.description ||
    hasEndDate !== !!group.endDate ||
    (hasEndDate && group.endDate && editEndDate.getTime() !== group.endDate.getTime());

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const updates: Partial<Pick<Group, 'name' | 'description' | 'endDate'>> = {};
    if (editName.trim() !== group.name) updates.name = editName.trim();
    if (editDescription.trim() !== group.description) updates.description = editDescription.trim();
    if (hasEndDate) updates.endDate = editEndDate;

    setIsSaving(true);
    try {
      await onUpdateGroup(updates);
      Alert.alert('Saved', 'Group settings updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, editName, editDescription, hasEndDate, editEndDate, group, onUpdateGroup]);

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveMember(memberId);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? Your linked habits will be unlinked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await onLeaveGroup();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleEndGroup = () => {
    Alert.alert(
      'End Group',
      'Are you sure you want to end this group? This action cannot be undone. All members will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Group',
          style: 'destructive',
          onPress: async () => {
            try {
              await onEndGroup();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to end group');
            }
          },
        },
      ]
    );
  };

  // Non-admin members
  const nonAdminMembers = group.members.filter((m) => m.userId !== group.adminId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close group settings"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Admin Edit Section */}
          {isAdmin && (
            <>
              {/* Group Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    nameValidation && !nameValidation.valid && styles.inputError,
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  maxLength={50}
                  accessibilityLabel="Edit group name"
                />
                {nameValidation && !nameValidation.valid && (
                  <Text style={styles.errorText}>{nameValidation.error}</Text>
                )}
              </View>

              {/* Description */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    descValidation && !descValidation.valid && styles.inputError,
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Edit group description"
                />
                {descValidation && !descValidation.valid && (
                  <Text style={styles.errorText}>{descValidation.error}</Text>
                )}
              </View>

              {/* End Date */}
              <View style={styles.fieldContainer}>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>End Date</Text>
                  <TouchableOpacity
                    style={[styles.toggle, hasEndDate && styles.toggleActive]}
                    onPress={() => setHasEndDate(!hasEndDate)}
                    accessibilityLabel="Toggle end date"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: hasEndDate }}
                  >
                    <View style={[styles.toggleThumb, hasEndDate && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {hasEndDate && (
                  <View style={styles.datePickerContainer}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        const newDate = new Date(editEndDate);
                        newDate.setDate(newDate.getDate() + 1);
                        setEditEndDate(newDate);
                      }}
                      accessibilityLabel="Select end date"
                      accessibilityRole="button"
                    >
                      <Ionicons name="calendar-outline" size={20} color={Colors.primaryText} />
                      <Text style={styles.dateButtonText}>
                        {editEndDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.dateAdjustRow}>
                      <TouchableOpacity
                        style={styles.dateAdjustButton}
                        onPress={() => {
                          const newDate = new Date(editEndDate);
                          newDate.setDate(newDate.getDate() - 7);
                          const minDate = new Date();
                          minDate.setDate(minDate.getDate() + 2);
                          if (newDate > minDate) setEditEndDate(newDate);
                        }}
                        accessibilityLabel="Subtract 7 days"
                        accessibilityRole="button"
                      >
                        <Text style={styles.dateAdjustText}>-7 days</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateAdjustButton}
                        onPress={() => {
                          const newDate = new Date(editEndDate);
                          newDate.setDate(newDate.getDate() + 1);
                          setEditEndDate(newDate);
                        }}
                        accessibilityLabel="Add 1 day"
                        accessibilityRole="button"
                      >
                        <Text style={styles.dateAdjustText}>+1 day</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateAdjustButton}
                        onPress={() => {
                          const newDate = new Date(editEndDate);
                          newDate.setDate(newDate.getDate() + 7);
                          setEditEndDate(newDate);
                        }}
                        accessibilityLabel="Add 7 days"
                        accessibilityRole="button"
                      >
                        <Text style={styles.dateAdjustText}>+7 days</Text>
                      </TouchableOpacity>
                    </View>
                    {endDateValidation && !endDateValidation.valid && (
                      <Text style={styles.errorText}>{endDateValidation.error}</Text>
                    )}
                  </View>
                )}
              </View>

              {/* Save Button */}
              {hasChanges && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={isSaving}
                  accessibilityLabel="Save group settings"
                  accessibilityRole="button"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Members Section */}
              <Text style={styles.sectionTitle}>Members ({group.members.length})</Text>
              {nonAdminMembers.map((member) => (
                <View key={member.userId} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.userName}
                    </Text>
                    <Text style={styles.memberRole}>Member</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(member.userId, member.userName)}
                    accessibilityLabel={`Remove ${member.userName}`}
                    accessibilityRole="button"
                  >
                    <Ionicons name="person-remove-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Divider */}
              <View style={styles.divider} />

              {/* End Group */}
              <TouchableOpacity
                style={styles.destructiveButton}
                onPress={handleEndGroup}
                accessibilityLabel="End group"
                accessibilityRole="button"
              >
                <Ionicons name="stop-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.destructiveButtonText}>End Group</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Member View — Leave Group */}
          {!isAdmin && (
            <View style={styles.memberViewContainer}>
              <Text style={styles.sectionTitle}>Group: {group.name}</Text>
              <Text style={styles.memberViewDescription}>
                {group.description || 'No description'}
              </Text>
              <Text style={styles.memberViewMeta}>
                {group.members.length} members · Created{' '}
                {group.createdAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.destructiveButton}
                onPress={handleLeaveGroup}
                accessibilityLabel="Leave group"
                accessibilityRole="button"
              >
                <Ionicons name="exit-outline" size={20} color={Colors.error} />
                <Text style={styles.destructiveButtonText}>Leave Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 16,               // 8 × 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,                        // 8 × 2 (base)
    paddingBottom: 48,                  // 8 × 6 (spacious)
  },
  fieldContainer: {
    marginBottom: 24,                   // 8 × 3 (comfortable)
  },
  label: {
    fontSize: 14,                       // caption
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 12,
    fontSize: 16,                       // body
    color: Colors.primaryText,
    minHeight: 48,                      // 8 × 6 (touch target)
  },
  textArea: {
    minHeight: 80,                      // 8 × 10
    paddingTop: 12,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,                       // small
    color: Colors.error,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  toggle: {
    width: 48,                          // 8 × 6
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray.light,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.accent3,
  },
  toggleThumb: {
    width: 24,                          // 8 × 3
    height: 24,                         // 8 × 3
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  datePickerContainer: {
    marginTop: 8,                       // 8 × 1 (tight)
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 12,
    minHeight: 48,                      // 8 × 6 (touch target)
  },
  dateButtonText: {
    fontSize: 16,                       // body
    color: Colors.primaryText,
  },
  dateAdjustRow: {
    flexDirection: 'row',
    gap: 8,                             // 8 × 1 (tight)
    marginTop: 8,                       // 8 × 1 (tight)
  },
  dateAdjustButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,                // 8 × 1 (tight)
    borderRadius: 8,
    backgroundColor: Colors.gray.light,
    minHeight: 36,
  },
  dateAdjustText: {
    fontSize: 12,                       // small
    fontWeight: '500',                  // medium
    color: Colors.primaryText,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent1,   // Purple CTA
    borderRadius: 16,
    minHeight: 56,                      // 8 × 7 (primary button)
    paddingVertical: 16,               // 8 × 2 (base)
    marginBottom: 16,                   // 8 × 2 (base)
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '700',                  // bold
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray.light,
    marginVertical: 24,                // 8 × 3 (comfortable)
  },
  sectionTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 16,                   // 8 × 2 (base)
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,                        // 8 × 2 (base)
    marginBottom: 8,                    // 8 × 1 (tight)
    minHeight: 56,                      // 8 × 7
  },
  memberAvatar: {
    width: 40,                          // 8 × 5
    height: 40,                         // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                    // 8 × 2 (base)
  },
  memberAvatarText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
  },
  memberInfo: {
    flex: 1,
    marginRight: 16,                    // 8 × 2 (base)
  },
  memberName: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
  },
  removeButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4F4',
  },
  destructiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: Colors.error,         // Red (#FF4444)
    borderRadius: 16,
    minHeight: 56,                      // 8 × 7 (primary button)
    paddingVertical: 16,               // 8 × 2 (base)
  },
  destructiveButtonText: {
    color: Colors.error,               // Red (#FF4444)
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
  },
  memberViewContainer: {
    paddingTop: 8,                      // 8 × 1 (tight)
  },
  memberViewDescription: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
    lineHeight: 24,                     // 1.5 line height
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  memberViewMeta: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
  },
});
