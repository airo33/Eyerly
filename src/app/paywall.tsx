import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { usePurchases } from '@/hooks/use-purchases';
import { useTheme } from '@/hooks/use-theme';
import {
  FALLBACK_PRICES,
  IS_EXPO_GO,
  PlanId,
  purchasePlan,
  restorePurchases,
} from '@/lib/purchases';

export default function Paywall() {
  const theme = useTheme();
  const router = useRouter();
  const t = useT();
  const { refresh } = usePurchases();
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);

  const features = [
    t('paywall.featExercises'),
    t('paywall.featIntervals'),
    t('paywall.featSounds'),
    t('paywall.featUpdates'),
  ];

  const handleSubscribe = async () => {
    setBusy(true);
    const ok = await purchasePlan(plan);
    setBusy(false);
    if (ok) {
      await refresh();
      Alert.alert(t('paywall.purchasedTitle'), t('paywall.purchasedBody'));
      router.back();
    } else if (!IS_EXPO_GO) {
      Alert.alert(t('paywall.notCompletedTitle'), t('paywall.notCompletedBody'));
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const ok = await restorePurchases();
    setBusy(false);
    if (ok) {
      await refresh();
      Alert.alert(t('paywall.restoredTitle'), t('paywall.restoredBody'));
      router.back();
    } else {
      Alert.alert(t('paywall.nothingTitle'), t('paywall.nothingBody'));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <SymbolView
              name="xmark"
              size={20}
              tintColor={theme.textSecondary}
              fallback={null}
            />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <SymbolView
              name="eye.fill"
              size={64}
              tintColor={theme.accent}
              fallback={null}
            />
            <ThemedText type="title" style={styles.heroTitle}>
              {t('paywall.title')}
            </ThemedText>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.heroSubtitle}>
              {t('paywall.subtitle')}
            </ThemedText>
          </View>

          <View style={styles.features}>
            {features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <SymbolView
                  name="checkmark.circle.fill"
                  size={22}
                  tintColor={theme.accent}
                  fallback={null}
                />
                <ThemedText type="default" style={styles.featureText}>
                  {f}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.plans}>
            <PlanCard
              selected={plan === 'yearly'}
              onPress={() => setPlan('yearly')}
              title={t('paywall.yearly')}
              price={t('paywall.perYear', { price: FALLBACK_PRICES.yearly })}
              badge={t('paywall.save')}
              theme={theme}
            />
            <PlanCard
              selected={plan === 'monthly'}
              onPress={() => setPlan('monthly')}
              title={t('paywall.monthly')}
              price={t('paywall.perMonth', { price: FALLBACK_PRICES.monthly })}
              subtitle={t('settings.trial')}
              theme={theme}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={busy}
            onPress={handleSubscribe}
            style={[
              styles.cta,
              { backgroundColor: theme.accent, opacity: busy ? 0.5 : 1 },
            ]}>
            <ThemedText type="default" style={{ color: theme.onAccent }}>
              {plan === 'monthly'
                ? t('paywall.startTrial')
                : t('paywall.continue')}
            </ThemedText>
          </Pressable>

          <Pressable onPress={handleRestore} disabled={busy} hitSlop={8}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.restore}>
              {t('paywall.restore')}
            </ThemedText>
          </Pressable>

          {IS_EXPO_GO ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.devNote}>
              {t('paywall.devNote')}
            </ThemedText>
          ) : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function PlanCard({
  selected,
  onPress,
  title,
  price,
  subtitle,
  badge,
  theme,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  subtitle?: string;
  badge?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.planCard,
        {
          borderColor: selected ? theme.accent : theme.backgroundSelected,
          backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
        },
      ]}>
      <View style={styles.planLeft}>
        <ThemedText type="default">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {price}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
      <SymbolView
        name={selected ? 'largecircle.fill.circle' : 'circle'}
        size={22}
        tintColor={selected ? theme.accent : theme.textSecondary}
        fallback={null}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
    paddingBottom: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroTitle: {
    fontSize: 34,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  features: {
    gap: Spacing.three,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  featureText: {
    flex: 1,
  },
  plans: {
    gap: Spacing.two,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 2,
  },
  planLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    alignItems: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  restore: {
    textAlign: 'center',
  },
  devNote: {
    textAlign: 'center',
  },
});
