import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  title: string;
  initialValue: string;
  placeholder?: string;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

/**
 * Cross-platform single-line text prompt (Alert.prompt is iOS-only). Mount it
 * with a `key` that changes when it opens so the input resets to the current
 * value each time.
 */
export function TextPromptModal({
  visible,
  title,
  initialValue,
  placeholder,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
}: Props) {
  const theme = useTheme();
  const [value, setValue] = useState(initialValue);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onCancel}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ThemedView
              style={[styles.sheet, { backgroundColor: theme.background }]}>
              <ThemedText type="default">{title}</ThemedText>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor={theme.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => onSave(value.trim())}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                  },
                ]}
              />
              <View style={styles.actions}>
                <Pressable onPress={onCancel} hitSlop={8}>
                  <ThemedText type="default" themeColor="textSecondary">
                    {cancelLabel}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => onSave(value.trim())} hitSlop={8}>
                  <ThemedText type="default" style={{ color: theme.accent }}>
                    {saveLabel}
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
