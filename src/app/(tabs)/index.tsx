import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeeklyChart } from '@/components/weekly-chart';
import {
  DEFAULT_INTERVAL_MIN,
  INTERVAL_OPTIONS_MIN,
  IntervalMin,
} from '@/constants/eyerly';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { usePurchases } from '@/hooks/use-purchases';
import { useSettings } from '@/hooks/use-settings';
import { useStreak } from '@/hooks/use-streak';
import { useTheme } from '@/hooks/use-theme';
import {
  cancelReminders,
  requestPermission,
  rescheduleReminders,
  sendTestNotification,
} from '@/lib/notifications';
import { didSessionToday, displayStreak, lastNDays } from '@/lib/streak';

const PAUSE_MS = 60 * 60 * 1000;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const t = useT();
  const { settings, update, hydrated } = useSettings();
  const { streak } = useStreak();
  const { isPro } = usePurchases();

  const streakDays = displayStreak(streak);
  const activeToday = didSessionToday(streak);
  const weekBars = lastNDays(streak, 7);
  const weekTotal = weekBars.reduce((sum, b) => sum + b.count, 0);

  // Ticking clock so the pause state/countdown stays current without calling
  // Date.now() during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isPaused = settings.pausedUntil !== null && settings.pausedUntil > now;

  // Auto-clear an expired pause: on mount, on each clock tick, and whenever the
  // app returns to the foreground (the pause hour may have elapsed while
  // backgrounded).
  useEffect(() => {
    if (!hydrated) return;

    const clearIfExpired = () => {
      if (settings.pausedUntil !== null && settings.pausedUntil <= Date.now()) {
        const cleared = { ...settings, pausedUntil: null };
        update({ pausedUntil: null });
        if (settings.enabled) rescheduleReminders(cleared);
      }
    };

    clearIfExpired();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(Date.now());
        clearIfExpired();
      }
    });
    return () => sub.remove();
  }, [hydrated, settings, update, now]);

  const handleToggle = async (next: boolean) => {
    if (next) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for Eyerly in iOS Settings to get reminders.',
        );
        return;
      }
      const nextSettings = { ...settings, enabled: true, pausedUntil: null };
      update({ enabled: true, pausedUntil: null });
      await rescheduleReminders(nextSettings);
    } else {
      update({ enabled: false, pausedUntil: null });
      await cancelReminders();
    }
  };

  const handleIntervalChange = async (opt: IntervalMin) => {
    if (opt !== DEFAULT_INTERVAL_MIN && !isPro) {
      router.push('/paywall');
      return;
    }
    const nextSettings = { ...settings, intervalMin: opt };
    update({ intervalMin: opt });
    if (settings.enabled && !isPaused) {
      await rescheduleReminders(nextSettings);
    }
  };

  const handlePauseToggle = async () => {
    if (isPaused) {
      const nextSettings = { ...settings, pausedUntil: null };
      update({ pausedUntil: null });
      if (settings.enabled) await rescheduleReminders(nextSettings);
    } else {
      const t0 = Date.now();
      setNow(t0);
      update({ pausedUntil: t0 + PAUSE_MS });
      await cancelReminders();
    }
  };

  const pauseMinutesLeft =
    isPaused && settings.pausedUntil !== null
      ? Math.max(1, Math.ceil((settings.pausedUntil - now) / 60000))
      : 0;

  const statusHint = isPaused
    ? t('home.paused', { min: pauseMinutesLeft })
    : settings.enabled
      ? t('home.every', {
          min: settings.intervalMin,
          start: `${pad(settings.activeStartHour)}:${pad(settings.activeStartMinute)}`,
          end: `${pad(settings.activeEndHour)}:${pad(settings.activeEndMinute)}`,
        })
      : t('home.off');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SymbolView
            name="eye.fill"
            size={40}
            tintColor={theme.accent}
            fallback={null}
          />
          <ThemedText type="title" style={styles.title}>
            Eyerly
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            {t('home.tagline', { min: settings.intervalMin })}
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.streakCard}>
          <View style={styles.streakMain}>
            <ThemedText style={[styles.streakNumber, { color: theme.accent }]}>
              {streakDays}
            </ThemedText>
            <View style={styles.streakLabel}>
              <ThemedText type="default">
                {t('streak.dayStreak', { count: streakDays })}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {activeToday
                  ? t('streak.hintDone')
                  : streakDays > 0
                    ? t('streak.hintKeep')
                    : t('streak.hintStart')}
              </ThemedText>
            </View>
          </View>
          <View style={styles.streakStats}>
            <View style={styles.stat}>
              <ThemedText type="default">{streak.longestStreak}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('streak.best')}
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="default">{streak.totalSessions}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('streak.sessions')}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.weekHeader}>
            <ThemedText type="default">{t('streak.thisWeek')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {weekTotal} {t('streak.sessions')}
            </ThemedText>
          </View>
          <WeeklyChart bars={weekBars} />
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <ThemedText type="default">{t('home.reminders')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {statusHint}
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled && !isPaused}
              onValueChange={handleToggle}
              disabled={!hydrated}
            />
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="default" style={styles.cardTitle}>
            {t('home.interval')}
          </ThemedText>
          <View style={styles.chipRow}>
            {INTERVAL_OPTIONS_MIN.map((opt) => {
              const active = opt === settings.intervalMin;
              const locked = opt !== DEFAULT_INTERVAL_MIN && !isPro;
              return (
                <Pressable
                  key={opt}
                  onPress={() => handleIntervalChange(opt)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? theme.accent
                        : theme.backgroundSelected,
                    },
                  ]}>
                  <View style={styles.chipInner}>
                    <ThemedText
                      type="default"
                      style={{ color: active ? theme.onAccent : theme.text }}>
                      {t('home.minUnit', { n: opt })}
                    </ThemedText>
                    {locked ? (
                      <SymbolView
                        name="lock.fill"
                        size={11}
                        tintColor={theme.textSecondary}
                        fallback={null}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        <Pressable
          onPress={handlePauseToggle}
          style={[
            styles.pauseButton,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <ThemedText type="default">
            {isPaused ? t('home.resume') : t('home.pause')}
          </ThemedText>
        </Pressable>

        {__DEV__ && (
          <Pressable
            onPress={async () => {
              const granted = await requestPermission();
              if (!granted) {
                Alert.alert('Notifications blocked');
                return;
              }
              await sendTestNotification();
            }}
            style={[
              styles.pauseButton,
              { backgroundColor: theme.backgroundSelected },
            ]}>
            <ThemedText type="small" themeColor="textSecondary">
              Dev · Send test notification in 3s
            </ThemedText>
          </Pressable>
        )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: Fonts.rounded,
  },
  tagline: {
    textAlign: 'center',
  },
  streakCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.four,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  streakNumber: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
    fontVariant: ['tabular-nums'],
    minWidth: 72,
  },
  streakLabel: {
    flex: 1,
    gap: Spacing.half,
  },
  streakStats: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  stat: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  cardTitle: {
    marginBottom: Spacing.one,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowLabel: {
    flex: 1,
    gap: Spacing.half,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pauseButton: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
});
