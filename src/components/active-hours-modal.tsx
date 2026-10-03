import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  onCancel: () => void;
  onSave: (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
  ) => void;
};

function toDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function ActiveHoursModal({
  visible,
  startHour,
  startMinute,
  endHour,
  endMinute,
  onCancel,
  onSave,
}: Props) {
  const theme = useTheme();
  const t = useT();
  const [start, setStart] = useState(toDate(startHour, startMinute));
  const [end, setEnd] = useState(toDate(endHour, endMinute));

  const handleSave = () => {
    const startTotalMin = start.getHours() * 60 + start.getMinutes();
    const endTotalMin = end.getHours() * 60 + end.getMinutes();
    if (startTotalMin >= endTotalMin) {
      Alert.alert(t('activeHours.invalidTitle'), t('activeHours.invalidBody'));
      return;
    }
    onSave(start.getHours(), start.getMinutes(), end.getHours(), end.getMinutes());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView
            style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
              <Pressable onPress={onCancel} hitSlop={8}>
                <ThemedText type="default" themeColor="textSecondary">
                  {t('common.cancel')}
                </ThemedText>
              </Pressable>
              <ThemedText type="default">{t('activeHours.title')}</ThemedText>
              <Pressable onPress={handleSave} hitSlop={8}>
                <ThemedText type="default" style={{ color: theme.accent }}>
                  {t('common.save')}
                </ThemedText>
              </Pressable>
            </View>

            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.hint}>
              {t('activeHours.hint')}
            </ThemedText>

            <View style={styles.pickerRow}>
              <ThemedText type="default">{t('activeHours.start')}</ThemedText>
              <DateTimePicker
                value={start}
                mode="time"
                minuteInterval={15}
                display="default"
                onChange={(_, d) => d && setStart(d)}
              />
            </View>

            <View style={styles.pickerRow}>
              <ThemedText type="default">{t('activeHours.end')}</ThemedText>
              <DateTimePicker
                value={end}
                mode="time"
                minuteInterval={15}
                display="default"
                onChange={(_, d) => d && setEnd(d)}
              />
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  hint: {
    paddingBottom: Spacing.two,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
