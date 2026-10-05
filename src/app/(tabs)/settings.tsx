import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveHoursModal } from '@/components/active-hours-modal';
import { SelectModal } from '@/components/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COUNTRIES, findCountry, flagEmoji } from '@/constants/countries';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@/constants/languages';
import { SOUND_PRESETS, SoundPreset } from '@/constants/sounds';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useLanguage, useT } from '@/hooks/use-i18n';
import { usePurchases } from '@/hooks/use-purchases';
import { useSettings } from '@/hooks/use-settings';
import { useTheme } from '@/hooks/use-theme';
import { rescheduleReminders } from '@/lib/notifications';
import { restorePurchases } from '@/lib/purchases';
import { formatTime, type Settings } from '@/lib/settings';
import { playPreview } from '@/lib/sound-preview';

type Row = {
  key: string;
  title: string;
  hint?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
};

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const language = useLanguage();
  const { settings, update } = useSettings();
  const { isPro, refresh } = usePurchases();
  const [activeHoursOpen, setActiveHoursOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);

  const presetLabel = (p: SoundPreset) =>
    t(`settings.preset${p.charAt(0).toUpperCase()}${p.slice(1)}`);

  const handleRestore = async () => {
    const ok = await restorePurchases();
    await refresh();
    Alert.alert(
      ok ? t('paywall.restoredTitle') : t('paywall.nothingTitle'),
      ok ? t('paywall.restoredBody') : t('paywall.nothingBody'),
    );
  };

  // Apply a settings patch and, if reminders are live, reschedule them so the
  // already-scheduled notifications pick up the new language/sound/hours.
  const applyReminderChange = async (patch: Partial<Settings>) => {
    update(patch);
    const next = { ...settings, ...patch };
    if (next.enabled) {
      await rescheduleReminders(next);
    }
  };

  const handleEditName = () => {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(
        t('profile.name'),
        undefined,
        (text) => update({ name: (text ?? '').trim() }),
        'plain-text',
        settings.name,
      );
    }
  };

  const country = findCountry(settings.countryCode);
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const activeHoursHint = `${formatTime(settings.activeStartHour, settings.activeStartMinute)} – ${formatTime(settings.activeEndHour, settings.activeEndMinute)}`;

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: t('settings.groupProfile'),
      rows: [
        {
          key: 'name',
          title: t('profile.name'),
          hint: settings.name || t('profile.notSet'),
          onPress: handleEditName,
        },
        {
          key: 'country',
          title: t('profile.country'),
          hint: country
            ? `${flagEmoji(country.code)}  ${country.name}`
            : t('profile.notSet'),
          onPress: () => setCountryOpen(true),
        },
        {
          key: 'language',
          title: t('profile.language'),
          hint: currentLang?.native,
          onPress: () => setLanguageOpen(true),
        },
      ],
    },
    {
      title: t('settings.groupReminders'),
      rows: [
        {
          key: 'interval',
          title: t('settings.interval'),
          hint: t('settings.everyMin', { min: settings.intervalMin }),
        },
        {
          key: 'active',
          title: t('settings.activeHours'),
          hint: activeHoursHint,
          onPress: () => setActiveHoursOpen(true),
        },
        {
          key: 'sound',
          title: t('settings.soundRow'),
          toggle: {
            value: settings.sound,
            onValueChange: (v) => applyReminderChange({ sound: v }),
          },
        },
        {
          key: 'vibration',
          title: t('settings.vibrationRow'),
          toggle: {
            value: settings.vibration,
            onValueChange: (v) => update({ vibration: v }),
          },
        },
        {
          key: 'notifSound',
          title: t('settings.notifSound'),
          hint: presetLabel(settings.soundPreset),
          onPress: () => setSoundOpen(true),
        },
      ],
    },
    {
      title: t('settings.groupSubscription'),
      rows: [
        {
          key: 'paywall',
          title: t('settings.upgrade'),
          hint: isPro ? t('settings.proActive') : t('settings.trial'),
          onPress: isPro ? undefined : () => router.push('/paywall'),
        },
        {
          key: 'restore',
          title: t('settings.restore'),
          onPress: handleRestore,
        },
      ],
    },
    {
      title: t('settings.groupAbout'),
      rows: [
        { key: 'privacy', title: t('settings.privacy') },
        { key: 'terms', title: t('settings.terms') },
        { key: 'contact', title: t('settings.contact') },
      ],
    },
  ];

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
          <ThemedText type="title">{t('settings.title')}</ThemedText>
        </View>

        {groups.map((group) => (
          <View key={group.title} style={styles.groupWrap}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.groupTitle}>
              {group.title.toUpperCase()}
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.group}>
              {group.rows.map((r, i) => (
                <Pressable
                  key={r.key}
                  onPress={r.onPress}
                  disabled={!r.onPress || !!r.toggle}
                  style={({ pressed }) => [
                    styles.row,
                    i !== group.rows.length - 1 && {
                      borderBottomColor: theme.backgroundSelected,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                    pressed && r.onPress && !r.toggle && { opacity: 0.6 },
                  ]}>
                  <ThemedText type="default">{r.title}</ThemedText>
                  <View style={styles.rowRight}>
                    {r.hint ? (
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.hint}
                        numberOfLines={1}>
                        {r.hint}
                      </ThemedText>
                    ) : null}
                    {r.toggle ? (
                      <Switch
                        value={r.toggle.value}
                        onValueChange={r.toggle.onValueChange}
                      />
                    ) : r.onPress ? (
                      <SymbolView
                        name="chevron.right"
                        size={14}
                        tintColor={theme.textSecondary}
                        fallback={null}
                      />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ThemedView>
          </View>
        ))}

        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.version}>
          Eyerly v0.1.0
        </ThemedText>
      </ScrollView>

      <ActiveHoursModal
        key={activeHoursOpen ? 'open' : 'closed'}
        visible={activeHoursOpen}
        startHour={settings.activeStartHour}
        startMinute={settings.activeStartMinute}
        endHour={settings.activeEndHour}
        endMinute={settings.activeEndMinute}
        onCancel={() => setActiveHoursOpen(false)}
        onSave={async (sh, sm, eh, em) => {
          setActiveHoursOpen(false);
          await applyReminderChange({
            activeStartHour: sh,
            activeStartMinute: sm,
            activeEndHour: eh,
            activeEndMinute: em,
          });
        }}
      />

      <SelectModal
        visible={countryOpen}
        title={t('profile.selectCountry')}
        cancelLabel={t('common.cancel')}
        searchable
        searchPlaceholder={t('profile.search')}
        selectedKey={settings.countryCode}
        items={COUNTRIES.map((c) => ({
          key: c.code,
          label: c.name,
          left: flagEmoji(c.code),
        }))}
        onSelect={(key) => {
          update({ countryCode: key });
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
          setLanguageOpen(false);
          applyReminderChange({ language: key as LanguageCode });
        }}
        onCancel={() => setLanguageOpen(false)}
      />

      <SelectModal
        visible={soundOpen}
        title={t('settings.notifSound')}
        cancelLabel={t('common.cancel')}
        selectedKey={settings.soundPreset}
        items={SOUND_PRESETS.map((p) => ({ key: p, label: presetLabel(p) }))}
        onSelect={(key) => {
          const preset = key as SoundPreset;
          applyReminderChange({ soundPreset: preset });
          playPreview(preset);
        }}
        onCancel={() => setSoundOpen(false)}
      />
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
    paddingHorizontal: Spacing.one,
  },
  groupWrap: {
    gap: Spacing.two,
  },
  groupTitle: {
    paddingHorizontal: Spacing.three,
    letterSpacing: 0.5,
  },
  group: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    minHeight: 48,
    gap: Spacing.three,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  hint: {
    flexShrink: 1,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
