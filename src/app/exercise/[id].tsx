import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseAnimation } from '@/components/exercise-animation';
import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EXERCISES } from '@/constants/eyerly';
import { Fonts, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useStreak } from '@/hooks/use-streak';
import { useTheme } from '@/hooks/use-theme';

export default function ExerciseSession() {
  const theme = useTheme();
  const router = useRouter();
  const t = useT();
  const { recordCompletedSession } = useStreak();
  const { settings } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = EXERCISES.find((e) => e.id === id);

  const [remaining, setRemaining] = useState(exercise?.durationSec ?? 20);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedRef = useRef(false);
  const vibrationRef = useRef(settings.vibration);
  vibrationRef.current = settings.vibration;

  useEffect(() => {
    if (!exercise) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDone(true);
          if (!recordedRef.current) {
            recordedRef.current = true;
            recordCompletedSession();
            if (vibrationRef.current) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
            }
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [exercise, recordCompletedSession]);

  if (!exercise) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.body}>
            <ThemedText type="default">{t('session.notFound')}</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const timeStr = `${mm}:${ss.toString().padStart(2, '0')}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <SymbolView
              name="xmark"
              size={20}
              tintColor={theme.text}
              fallback={null}
            />
          </Pressable>
        </View>

        <View style={styles.body}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.eyebrow}>
            {t('session.eyebrow')}
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            {t(`ex.${exercise.i18nKey}Title`)}
          </ThemedText>
          <ThemedText
            type="default"
            themeColor="textSecondary"
            style={styles.subtitle}>
            {t(`ex.${exercise.i18nKey}Sub`)}
          </ThemedText>

          <ProgressRing
            size={240}
            strokeWidth={6}
            durationSec={exercise.durationSec}
            color={theme.accent}
            trackColor={theme.backgroundSelected}
            complete={done}>
            {done ? (
              <SymbolView
                name="checkmark"
                size={72}
                tintColor={theme.accent}
                fallback={null}
              />
            ) : (
              <ExerciseAnimation type={exercise.anim} />
            )}
          </ProgressRing>

          {done ? (
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.doneText}>
              {t('session.done', { sec: exercise.durationSec })}
            </ThemedText>
          ) : (
            <ThemedText style={styles.timer}>{timeStr}</ThemedText>
          )}
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.cta,
              {
                backgroundColor: done ? theme.accent : theme.backgroundElement,
              },
            ]}>
            <ThemedText
              type="default"
              style={{ color: done ? theme.onAccent : theme.text }}>
              {done ? t('common.done') : t('common.skip')}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  eyebrow: {
    letterSpacing: 1,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  timer: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '400',
    fontFamily: Fonts.rounded,
    fontVariant: ['tabular-nums'],
    marginTop: Spacing.three,
  },
  doneText: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  ctaWrap: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  cta: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
});
