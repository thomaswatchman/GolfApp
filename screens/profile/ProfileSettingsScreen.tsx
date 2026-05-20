import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing, radius, fontSize } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { StatOption, STAT_LABELS } from './ProfileScreen'

const STAT_OPTIONS: StatOption[] = ['following', 'followers', 'avg_score', 'gir_pct', 'fairways_pct', 'rounds_year']

// Re-export so ProfileScreen can import it
export { StatOption, STAT_LABELS }

interface Settings {
  showHandicap: boolean
  showName: boolean
  statSlot3: StatOption
  statSlot4: StatOption
}

function ScreenHeader({ title }: { title: string }) {
  const navigation = useNavigation()
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>‹ back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  )
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string
  description?: string
  value: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderLight, true: colors.accent }}
        thumbColor={colors.textBright}
      />
    </View>
  )
}

function StatPicker({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string
  value: StatOption
  onChange: (v: StatOption) => void
  exclude: StatOption
}) {
  return (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerOptions}>
        {STAT_OPTIONS.filter(o => o !== exclude).map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.pickerOption, value === option && styles.pickerOptionActive]}
            onPress={() => onChange(option)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pickerOptionText, value === option && styles.pickerOptionTextActive]}>
              {STAT_LABELS[option]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default function ProfileSettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    showHandicap: true,
    showName: true,
    statSlot3: 'following',
    statSlot4: 'followers',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('show_handicap, show_name, stat_slot_3, stat_slot_4')
        .eq('id', user.id)
        .single()
      if (data) {
        setSettings({
          showHandicap: data.show_handicap ?? true,
          showName: data.show_name ?? true,
          statSlot3: (data.stat_slot_3 as StatOption) ?? 'following',
          statSlot4: (data.stat_slot_4 as StatOption) ?? 'followers',
        })
      }
    }
    load()
  }, [])

  async function save(updated: Partial<Settings>) {
    const next = { ...settings, ...updated }
    setSettings(next)
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      show_handicap: next.showHandicap,
      show_name: next.showName,
      stat_slot_3: next.statSlot3,
      stat_slot_4: next.statSlot4,
    }).eq('id', user.id)
    setSaving(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="profile settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>visibility</Text>
        <View style={styles.card}>
          <SettingRow
            label="show name"
            description="display your name on your public profile"
            value={settings.showName}
            onToggle={v => save({ showName: v })}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="show handicap"
            description="display your handicap index publicly"
            value={settings.showHandicap}
            onToggle={v => save({ showHandicap: v })}
          />
        </View>

        <Text style={styles.sectionTitle}>stats bar</Text>
        <Text style={styles.sectionSubtitle}>
          rounds and best round are always shown. choose what appears in the last two slots.
        </Text>
        <View style={styles.card}>
          <StatPicker
            label="slot 3"
            value={settings.statSlot3}
            onChange={v => save({ statSlot3: v })}
            exclude={settings.statSlot4}
          />
          <View style={styles.rowDivider} />
          <StatPicker
            label="slot 4"
            value={settings.statSlot4}
            onChange={v => save({ statSlot4: v })}
            exclude={settings.statSlot3}
          />
        </View>

        {saving && (
          <Text style={styles.savingText}>saving…</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.accent, fontSize: fontSize.md },
  headerTitle: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500', marginTop: spacing.xs },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { color: colors.textBright, fontSize: fontSize.sm, fontWeight: '500', textTransform: 'lowercase', marginBottom: spacing.xs },
  sectionSubtitle: { color: colors.muted, fontSize: fontSize.sm, lineHeight: 20, marginTop: -spacing.sm, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  settingText: { flex: 1, marginRight: spacing.md },
  settingLabel: { color: colors.textBright, fontSize: fontSize.md },
  settingDesc: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md },
  pickerSection: { padding: spacing.md },
  pickerLabel: { color: colors.muted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  pickerOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  pickerOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pickerOptionText: { color: colors.muted, fontSize: fontSize.sm },
  pickerOptionTextActive: { color: colors.bg, fontWeight: '500' },
  savingText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
})
