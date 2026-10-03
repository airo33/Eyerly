import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectItem = {
  key: string;
  label: string;
  left?: string;
  sublabel?: string;
};

type Props = {
  visible: boolean;
  title: string;
  items: SelectItem[];
  selectedKey: string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  cancelLabel: string;
  onSelect: (key: string) => void;
  onCancel: () => void;
};

export function SelectModal({
  visible,
  title,
  items,
  selectedKey,
  searchable,
  searchPlaceholder,
  cancelLabel,
  onSelect,
  onCancel,
}: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query, searchable]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Pressable onPress={onCancel} hitSlop={8}>
              <ThemedText type="default" themeColor="textSecondary">
                {cancelLabel}
              </ThemedText>
            </Pressable>
            <ThemedText type="default">{title}</ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          {searchable ? (
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <SymbolView
                name="magnifyingglass"
                size={16}
                tintColor={theme.textSecondary}
                fallback={null}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
                autoCorrect={false}
              />
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(i) => i.key}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const selected = item.key === selectedKey;
              return (
                <Pressable
                  onPress={() => onSelect(item.key)}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: theme.backgroundElement },
                    pressed && { opacity: 0.6 },
                  ]}>
                  {item.left ? (
                    <ThemedText style={styles.rowLeft}>{item.left}</ThemedText>
                  ) : null}
                  <View style={styles.rowMain}>
                    <ThemedText type="default">{item.label}</ThemedText>
                    {item.sublabel ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.sublabel}
                      </ThemedText>
                    ) : null}
                  </View>
                  {selected ? (
                    <SymbolView
                      name="checkmark"
                      size={18}
                      tintColor={theme.accent}
                      fallback={null}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerSpacer: { width: 48 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.one,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    fontSize: 24,
  },
  rowMain: {
    flex: 1,
    gap: Spacing.half,
  },
});
