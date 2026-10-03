import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import { DayBar } from '@/lib/streak';

const MAX_BAR = 72;
const MIN_BAR = 6;

export function WeeklyChart({ bars }: { bars: DayBar[] }) {
  const theme = useTheme();
  const t = useT();
  const weekdays = t('streak.weekdays') as unknown as string[];
  const peak = Math.max(1, ...bars.map((b) => b.count));

  return (
    <View style={styles.row}>
      {bars.map((b) => {
        const h =
          b.count === 0 ? MIN_BAR : MIN_BAR + (b.count / peak) * (MAX_BAR - MIN_BAR);
        return (
          <View key={b.key} style={styles.col}>
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor:
                      b.count === 0
                        ? theme.backgroundSelected
                        : b.isToday
                          ? theme.accent
                          : theme.accentSoft,
                  },
                ]}
              />
            </View>
            <ThemedText
              type="small"
              themeColor={b.isToday ? 'text' : 'textSecondary'}>
              {Array.isArray(weekdays) ? weekdays[b.weekday] : ''}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  barArea: {
    height: MAX_BAR,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
});
