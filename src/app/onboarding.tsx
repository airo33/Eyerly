import { type Href, useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectModal } from '@/components/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COUNTRIES, findCountry, flagEmoji } from '@/constants/countries';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@/constants/languages';
import { Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTheme } from '@/hooks/use-theme';
import { deviceLanguage } from '@/lib/i18n';
import { requestPermission } from '@/lib/notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const t = useT();
  const { settings, update } = useSettings();
  const scrollRef = useRef<ScrollView>(null);

  const [stage, setStage] = useState<'intro' | 'profile'>('intro');
  const [page, setPage] = useState(0);

  const [name, setName] = useState(settings.name);
  const [countryCode, setCountryCode] = useState<string | null>(
    settings.countryCode,
  );
  const [language, setLanguage] = useState<LanguageCode>(
    settings.language ?? deviceLanguage(),
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const introPages: { icon: SFSymbol; title: string; body: string }[] = [
    { icon: 'eye', title: t('onboarding.p1Title'), body: t('onboarding.p1Body') },
    {
      icon: 'bell.badge',
      title: t('onboarding.p2Title'),
      body: t('onboarding.p2Body'),
    },
  ];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (p !== page) setPage(p);
  };

  const goNext = () => {
    if (page < introPages.length - 1) {
      scrollRef.current?.scrollTo({
        x: (page + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      setStage('profile');
    }
  };

  const finish = async (askPermission: boolean) => {
    if (askPermission) {
      await requestPermission();
    }
    update({
      name: name.trim(),
      countryCode,
      language,
      onboardingDone: true,
    });
    router.replace('/' as Href);
  };

  const selectedCountry = findCountry(countryCode);
  const selectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  if (stage === 'profile') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.profileContent}>
            <ThemedText type="title" style={styles.profileTitle}>
              {t('onboarding.p3Title')}
            </ThemedText>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.profileBody}>
              {t('onboarding.p3Body')}
            </ThemedText>

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('profile.name')}
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('profile.namePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                  },
                ]}
              />
            </View>

            <Pressable
              style={[styles.field, styles.rowField, { backgroundColor: theme.backgroundElement }]}
              onPress={() => setCountryOpen(true)}>
              <ThemedText type="default">{t('profile.country')}</ThemedText>
              <View style={styles.rowRight}>
                <ThemedText type="default" themeColor="textSecondary">
                  {selectedCountry
                    ? `${flagEmoji(selectedCountry.code)}  ${selectedCountry.name}`
                    : t('profile.notSet')}
                </ThemedText>
                <SymbolView
                  name="chevron.right"
                  size={14}
                  tintColor={theme.textSecondary}
                  fallback={null}
                />
              </View>
            </Pressable>

            <Pressable
              style={[styles.field, styles.rowField, { backgroundColor: theme.backgroundElement }]}
              onPress={() => setLanguageOpen(true)}>
              <ThemedText type="default">{t('profile.language')}</ThemedText>
              <View style={styles.rowRight}>
                <ThemedText type="default" themeColor="textSecondary">
                  {selectedLang?.native}
                </ThemedText>
                <SymbolView
                  name="chevron.right"
                  size={14}
                  tintColor={theme.textSecondary}
                  fallback={null}
                />
              </View>
            </Pressable>
          </ScrollView>

          <View style={styles.ctaWrap}>
            <Pressable
              onPress={() => finish(true)}
              style={[styles.cta, { backgroundColor: theme.accent }]}>
              <ThemedText type="default" style={{ color: theme.onAccent }}>
                {t('onboarding.enableNotifications')}
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>

        <SelectModal
          visible={countryOpen}
          title={t('profile.selectCountry')}
          cancelLabel={t('common.cancel')}
          searchable
          searchPlaceholder={t('profile.search')}
          selectedKey={countryCode}
          items={COUNTRIES.map((c) => ({
            key: c.code,
            label: c.name,
            left: flagEmoji(c.code),
          }))}
          onSelect={(key) => {
            setCountryCode(key);
            setCountryOpen(false);
          }}
          onCancel={() => setCountryOpen(false)}
        />
        <SelectModal
          visible={languageOpen}
          title={t('profile.selectLanguage')}
          cancelLabel={t('common.cancel')}
          selectedKey={language}
          items={SUPPORTED_LANGUAGES.map((l) => ({
            key: l.code,
            label: l.native,
            sublabel: l.label,
          }))}
          onSelect={(key) => {
            setLanguage(key as LanguageCode);
            setLanguageOpen(false);
          }}
          onCancel={() => setLanguageOpen(false)}
        />
      </ThemedView>
    );
  }

  const isLastIntro = page === introPages.length - 1;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => finish(false)} hitSlop={12}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('common.skip')}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scroll}>
          {introPages.map((p, i) => (
            <View key={i} style={[styles.page, { width: SCREEN_WIDTH }]}>
              <SymbolView
                name={p.icon}
                size={100}
                tintColor={theme.accent}
                fallback={null}
              />
              <ThemedText type="title" style={styles.pageTitle}>
                {p.title}
              </ThemedText>
              <ThemedText
                type="default"
                themeColor="textSecondary"
                style={styles.pageBody}>
                {p.body}
              </ThemedText>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {introPages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === page ? theme.accent : theme.backgroundSelected,
                  width: i === page ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            onPress={goNext}
            style={[styles.cta, { backgroundColor: theme.accent }]}>
            <ThemedText type="default" style={{ color: theme.onAccent }}>
              {isLastIntro ? t('common.continue') : t('common.continue')}
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
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  scroll: { flex: 1 },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  pageTitle: {
    textAlign: 'center',
    fontSize: 36,
  },
  pageBody: {
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  dot: {
    height: 8,
    borderRadius: 4,
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
  profileContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  profileTitle: {
    fontSize: 34,
    lineHeight: 40,
  },
  profileBody: {
    lineHeight: 24,
    marginBottom: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
});
