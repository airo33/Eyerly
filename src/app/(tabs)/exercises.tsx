import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EXERCISES } from '@/constants/eyerly';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { usePurchases } from '@/hooks/use-purchases';
import { useTheme } from '@/hooks/use-theme';

export default function ExercisesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { isPro } = usePurchases();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: BottomTabInset + Spacing.four,
          },
        ]}>
        <View style={styles.header}>
          <ThemedText type="title">{t('exercisesScreen.title')}</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {t('exercisesScreen.subtitle')}
          </ThemedText>
        </View>

        <View style={styles.list}>
          {EXERCISES.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={() => {
                if (ex.isPro && !isPro) {
                  router.push('/paywall');
                  return;
                }
                router.push({ pathname: '/exercise/[id]', params: { id: ex.id } });
              }}
              style={({ pressed }) => [
                styles.itemPressable,
                pressed && { opacity: 0.7 },
              ]}>
              <ThemedView type="backgroundElement" style={styles.item}>
                <View style={styles.itemLeft}>
                  <ThemedText type="default">
                    {t(`ex.${ex.i18nKey}Title`)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t(`ex.${ex.i18nKey}Sub`)} · {ex.durationSec}s
                  </ThemedText>
                </View>
                {ex.isPro ? (
                  <View
                    style={[styles.proBadge, { backgroundColor: theme.accent }]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: theme.onAccent }}>
                      {t('exercisesScreen.pro')}
                    </ThemedText>
                  </View>
                ) : (
                  <SymbolView
                    name="play.circle.fill"
                    size={26}
                    tintColor={theme.accent}
                    fallback={null}
                  />
                )}
              </ThemedView>
            </Pressable>
          ))}
        </View>

        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.disclaimer}>
          {t('common.disclaimer')}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  disclaimer: {
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
  itemPressable: {
    borderRadius: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  itemLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  proBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
});
