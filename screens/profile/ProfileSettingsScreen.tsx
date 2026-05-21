import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { spacing, radius, fontSize, THEMES, THEME_LABELS, ThemeName, ColorScheme } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/ThemeContext'

// ─── Stat options ───────────────────────────────────────────────────────────

export type StatOption =
  | 'blank'
  | 'rounds'
  | 'best_round'
  | 'handicap'
  | 'following'
  | 'followers'
  | 'avg_score'
  | 'gir_pct'
  | 'fairways_pct'
  | 'rounds_year'
  | 'avg_driver'

export const STAT_LABELS: Record<StatOption, string> = {
  blank: '—  blank',
  rounds: 'rounds played',
  best_round: 'best round',
  handicap: 'handicap index',
  following: 'following',
  followers: 'followers',
  avg_score: 'avg score',
  gir_pct: 'GIR %',
  fairways_pct: 'fairways %',
  rounds_year: 'rounds this year',
  avg_driver: 'avg driver',
}

const ALL_STAT_OPTIONS: StatOption[] = [
  'blank', 'handicap', 'rounds', 'best_round', 'following', 'followers',
  'avg_score', 'gir_pct', 'fairways_pct', 'rounds_year', 'avg_driver',
]

// ─── Preferences shape ──────────────────────────────────────────────────────

interface Prefs {
  isPrivate: boolean
  statSlot1: StatOption
  statSlot2: StatOption
  statSlot3: StatOption
  statSlot4: StatOption
  theme: ThemeName
  pushNotifications: boolean
  notifyFollowers: boolean
  notifyComments: boolean
  emailNotifications: boolean
  distanceUnit: 'km' | 'mi' | 'auto'
}

const DEFAULT_PREFS: Prefs = {
  isPrivate: false,
  statSlot1: 'rounds',
  statSlot2: 'best_round',
  statSlot3: 'following',
  statSlot4: 'followers',
  theme: 'dark',
  pushNotifications: true,
  notifyFollowers: true,
  notifyComments: true,
  emailNotifications: false,
  distanceUnit: 'auto',
}

// ─── Style factory — call once per theme change ──────────────────────────────

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn: { minHeight: 44, justifyContent: 'center' },
    backText: { color: c.accent, fontSize: fontSize.md },
    headerTitle: { color: c.textBright, fontSize: fontSize.xl, fontWeight: '500', marginTop: spacing.xs },
    scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xs },
    sectionHeader: {
      color: c.muted, fontSize: fontSize.xs, fontWeight: '500',
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginTop: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.xs,
    },
    sectionNote: {
      color: c.inactive, fontSize: fontSize.xs, lineHeight: 18,
      marginBottom: spacing.xs, paddingHorizontal: spacing.xs,
    },
    card: {
      backgroundColor: c.surface, borderRadius: radius.lg,
      borderWidth: 1, borderColor: c.border, overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.md, paddingVertical: spacing.lg, minHeight: 62,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    rowText: { flex: 1, marginRight: spacing.md },
    rowLabel: { color: c.textBright, fontSize: fontSize.md },
    rowDesc: { color: c.muted, fontSize: fontSize.sm, marginTop: 2 },
    rowChevron: { color: c.muted, fontSize: 20 },
    statPickerValue: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    statPickerText: { color: c.muted, fontSize: fontSize.sm },
    radioGroup: { overflow: 'hidden' },
    radioOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 52,
    },
    radioOptionBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    radioLabel: { color: c.textBright, fontSize: fontSize.md },
    radioCircle: {
      width: 22, height: 22, borderRadius: radius.full,
      borderWidth: 2, borderColor: c.inactive,
      alignItems: 'center', justifyContent: 'center',
    },
    radioCircleActive: { borderColor: c.accent },
    radioInner: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: c.accent },
    themePreviewRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
    themeChip: {
      flex: 1, borderRadius: radius.md, borderWidth: 1,
      padding: spacing.sm, alignItems: 'center', gap: spacing.xs,
      minHeight: 72, justifyContent: 'center',
    },
    themeChipDot: { width: 22, height: 22, borderRadius: radius.full },
    themeChipLabel: { fontSize: fontSize.xs, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
      backgroundColor: c.surface, borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg, maxHeight: '70%',
      borderTopWidth: 1, borderColor: c.borderLight,
    },
    modalHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: c.borderLight, alignSelf: 'center', marginVertical: spacing.sm,
    },
    modalTitle: {
      color: c.muted, fontSize: fontSize.sm, fontWeight: '500',
      paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    },
    modalOption: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      borderTopWidth: 1, borderTopColor: c.border, minHeight: 52,
    },
    modalOptionActive: { backgroundColor: c.bg },
    modalOptionText: { color: c.textLight, fontSize: fontSize.md },
    modalOptionTextActive: { color: c.accent, fontWeight: '500' },
    modalOptionCheck: { color: c.accent, fontSize: fontSize.md },
    pwModal: { flex: 1, backgroundColor: c.bg },
    pwModalHeader: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    pwForm: { padding: spacing.md, gap: spacing.sm },
    pwLabel: { color: c.muted, fontSize: fontSize.sm },
    pwInput: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      color: c.textBright, fontSize: fontSize.md, minHeight: 52,
    },
    pwSaveBtn: {
      backgroundColor: c.accent, borderRadius: radius.md, paddingVertical: spacing.md,
      alignItems: 'center', minHeight: 52, justifyContent: 'center', marginTop: spacing.md,
    },
    pwSaveBtnText: { color: c.bg, fontSize: fontSize.md, fontWeight: '500' },
    pwCancelBtn: {
      marginTop: spacing.sm, paddingVertical: spacing.md, alignItems: 'center',
      minHeight: 52, justifyContent: 'center',
      borderWidth: 1, borderColor: c.border, borderRadius: radius.md,
    },
    pwCancelBtnText: { color: c.muted, fontSize: fontSize.md },
    version: { color: c.inactive, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.md },
    dangerText: { color: c.danger },
  })
}

// ─── Sub-components — each calls useTheme() directly ────────────────────────

function ScreenHeader({ title }: { title: string }) {
  const navigation = useNavigation()
  const { colors: c } = useTheme()
  return (
    <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: c.accent, fontSize: fontSize.md }}>‹ back</Text>
      </TouchableOpacity>
      <Text style={{ color: c.textBright, fontSize: fontSize.xl, fontWeight: '500', marginTop: spacing.xs }}>{title}</Text>
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  const { colors: c } = useTheme()
  return (
    <Text style={{
      color: c.muted, fontSize: fontSize.xs, fontWeight: '500',
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginTop: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.xs,
    }}>{title}</Text>
  )
}

function SettingRow({ label, description, value, onToggle, last }: {
  label: string; description?: string; value: boolean; onToggle: (v: boolean) => void; last?: boolean
}) {
  const { colors: c } = useTheme()
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg, minHeight: 62,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border,
    }}>
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text style={{ color: c.textBright, fontSize: fontSize.md }}>{label}</Text>
        {description && <Text style={{ color: c.muted, fontSize: fontSize.sm, marginTop: 2 }}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle}
        trackColor={{ false: c.borderLight, true: c.accent }}
        thumbColor={c.textBright}
      />
    </View>
  )
}

function ActionRow({ label, onPress, danger, last }: {
  label: string; description?: string; onPress: () => void; danger?: boolean; last?: boolean
}) {
  const { colors: c } = useTheme()
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg, minHeight: 62,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border,
    }}>
      <Text style={{ flex: 1, color: danger ? c.danger : c.textBright, fontSize: fontSize.md }}>{label}</Text>
      <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  )
}

function RadioGroup<T extends string>({ options, labels, value, onChange }: {
  options: readonly T[]; labels: Record<T, string>; value: T; onChange: (v: T) => void
}) {
  const { colors: c } = useTheme()
  return (
    <View>
      {options.map((opt, i) => (
        <TouchableOpacity key={opt} onPress={() => onChange(opt)} activeOpacity={0.75} style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 52,
          borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: c.border,
        }}>
          <Text style={{ color: c.textBright, fontSize: fontSize.md }}>{labels[opt]}</Text>
          <View style={{
            width: 22, height: 22, borderRadius: radius.full, borderWidth: 2,
            borderColor: value === opt ? c.accent : c.inactive,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {value === opt && <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: c.accent }} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function StatSlotPicker({ slotLabel, value, takenBy, onChange, last }: {
  slotLabel: string
  value: StatOption
  takenBy: Set<StatOption>  // stats selected in OTHER slots (blank excluded)
  onChange: (v: StatOption) => void
  last?: boolean
}) {
  const { colors: c } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.75} style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg, minHeight: 62,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border,
      }}>
        <Text style={{ flex: 1, color: c.textBright, fontSize: fontSize.md }}>{slotLabel}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: c.muted, fontSize: fontSize.sm }}>{STAT_LABELS[value]}</Text>
          <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '70%', borderTopWidth: 1, borderColor: c.borderLight }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.borderLight, alignSelf: 'center', marginVertical: spacing.sm }} />
          <Text style={{ color: c.muted, fontSize: fontSize.sm, fontWeight: '500', paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>{slotLabel}</Text>
          <FlatList
            data={ALL_STAT_OPTIONS}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const isCurrent = item === value
              // Only block options already in other slots; blank can appear in multiple slots
              const isUnavailable = item !== 'blank' && !isCurrent && takenBy.has(item)
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                    borderTopWidth: 1, borderTopColor: c.border, minHeight: 52,
                    backgroundColor: isCurrent ? c.bg : undefined,
                    opacity: isUnavailable ? 0.35 : 1,
                  }}
                  onPress={() => { if (!isUnavailable) { onChange(item); setOpen(false) } }}
                  activeOpacity={isUnavailable ? 1 : 0.75}
                >
                  <Text style={{ color: isCurrent ? c.accent : c.textLight, fontSize: fontSize.md, fontWeight: isCurrent ? '500' : '400' }}>
                    {STAT_LABELS[item]}
                  </Text>
                  {isCurrent
                    ? <Text style={{ color: c.accent, fontSize: fontSize.md }}>✓</Text>
                    : isUnavailable
                      ? <Text style={{ color: c.inactive, fontSize: fontSize.xs }}>in use</Text>
                      : null
                  }
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </Modal>
    </>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { colors: c } = useTheme()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (next.length < 6) { Alert.alert('too short', 'Password must be at least 6 characters'); return }
    if (next !== confirm) { Alert.alert('mismatch', 'Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: next })
    setLoading(false)
    if (error) { Alert.alert('error', error.message) } else { Alert.alert('done', 'Password updated'); onClose() }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ color: c.textBright, fontSize: fontSize.xl, fontWeight: '500', marginTop: spacing.xs }}>change password</Text>
        </View>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: c.muted, fontSize: fontSize.sm }}>new password</Text>
          <TextInput
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: c.textBright, fontSize: fontSize.md, minHeight: 52 }}
            value={next} onChangeText={setNext} secureTextEntry placeholder="min. 6 characters" placeholderTextColor={c.inactive} autoFocus
          />
          <Text style={{ color: c.muted, fontSize: fontSize.sm }}>confirm new password</Text>
          <TextInput
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: c.textBright, fontSize: fontSize.md, minHeight: 52 }}
            value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="••••••••" placeholderTextColor={c.inactive}
          />
          <TouchableOpacity
            style={{ backgroundColor: c.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', minHeight: 52, justifyContent: 'center', marginTop: spacing.md, opacity: loading ? 0.6 : 1 }}
            onPress={handleSave} disabled={loading} activeOpacity={0.85}
          >
            <Text style={{ color: c.bg, fontSize: fontSize.md, fontWeight: '500' }}>{loading ? 'saving…' : 'save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: spacing.sm, paddingVertical: spacing.md, alignItems: 'center', minHeight: 52, justifyContent: 'center', borderWidth: 1, borderColor: c.border, borderRadius: radius.md }}
            onPress={onClose} activeOpacity={0.75}
          >
            <Text style={{ color: c.muted, fontSize: fontSize.md }}>cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function ProfileSettingsScreen() {
  const { colors: c, setTheme: setContextTheme } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setPrefs({
          isPrivate: data.is_private ?? false,
          statSlot1: (data.stat_slot_1 as StatOption) ?? 'rounds',
          statSlot2: (data.stat_slot_2 as StatOption) ?? 'best_round',
          statSlot3: (data.stat_slot_3 as StatOption) ?? 'following',
          statSlot4: (data.stat_slot_4 as StatOption) ?? 'followers',
          theme: (data.theme as ThemeName) ?? 'dark',
          pushNotifications: data.push_notifications ?? true,
          notifyFollowers: data.notify_followers ?? true,
          notifyComments: data.notify_comments ?? true,
          emailNotifications: data.email_notifications ?? false,
          distanceUnit: (data.distance_unit as 'km' | 'mi' | 'auto') ?? 'auto',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    if (patch.theme) setContextTheme(patch.theme)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(next), 600)
  }

  async function persist(p: Prefs) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      is_private: p.isPrivate,
      stat_slot_1: p.statSlot1, stat_slot_2: p.statSlot2,
      stat_slot_3: p.statSlot3, stat_slot_4: p.statSlot4,
      theme: p.theme,
      push_notifications: p.pushNotifications,
      notify_followers: p.notifyFollowers,
      notify_comments: p.notifyComments,
      email_notifications: p.emailNotifications,
      distance_unit: p.distanceUnit,
    }).eq('id', user.id)
  }

  async function handleSignOut() {
    Alert.alert('sign out', 'are you sure?', [
      { text: 'cancel', style: 'cancel' },
      { text: 'sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  if (loading) return <SafeAreaView style={styles.container} />

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="settings" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Account ── */}
        <SectionHeader title="account" />
        <View style={styles.card}>
          <SettingRow label="private account" description="only connections see your full profile and rounds" value={prefs.isPrivate} onToggle={v => update({ isPrivate: v })} />
          <ActionRow label="change password" onPress={() => setShowPasswordModal(true)} last />
        </View>

        {/* ── Stats bar ── */}
        <SectionHeader title="stats bar" />
        <Text style={styles.sectionNote}>all four slots are customizable. set a slot to blank and the remaining stats fill the space evenly.</Text>
        <View style={styles.card}>
          <StatSlotPicker slotLabel="slot 1" value={prefs.statSlot1}
            takenBy={new Set([prefs.statSlot2, prefs.statSlot3, prefs.statSlot4].filter(s => s !== 'blank') as StatOption[])}
            onChange={v => update({ statSlot1: v })} />
          <StatSlotPicker slotLabel="slot 2" value={prefs.statSlot2}
            takenBy={new Set([prefs.statSlot1, prefs.statSlot3, prefs.statSlot4].filter(s => s !== 'blank') as StatOption[])}
            onChange={v => update({ statSlot2: v })} />
          <StatSlotPicker slotLabel="slot 3" value={prefs.statSlot3}
            takenBy={new Set([prefs.statSlot1, prefs.statSlot2, prefs.statSlot4].filter(s => s !== 'blank') as StatOption[])}
            onChange={v => update({ statSlot3: v })} />
          <StatSlotPicker slotLabel="slot 4" value={prefs.statSlot4}
            takenBy={new Set([prefs.statSlot1, prefs.statSlot2, prefs.statSlot3].filter(s => s !== 'blank') as StatOption[])}
            onChange={v => update({ statSlot4: v })} last />
        </View>

        {/* ── Appearance ── */}
        <SectionHeader title="appearance" />
        <View style={styles.card}>
          <View style={styles.themePreviewRow}>
            {(['dark', 'light', 'masters'] as ThemeName[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.themeChip,
                  { backgroundColor: THEMES[t].surface, borderColor: THEMES[t].border },
                  prefs.theme === t && { borderColor: c.accent, borderWidth: 2 },
                ]}
                onPress={() => update({ theme: t })}
                activeOpacity={0.75}
              >
                <View style={[styles.themeChipDot, { backgroundColor: THEMES[t].accent }]} />
                <Text style={[styles.themeChipLabel, { color: THEMES[t].textBright }]}>
                  {THEME_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Notifications ── */}
        <SectionHeader title="notifications" />
        <View style={styles.card}>
          <SettingRow label="push notifications" value={prefs.pushNotifications} onToggle={v => update({ pushNotifications: v })} />
          <SettingRow label="new followers" description="when someone follows you" value={prefs.notifyFollowers} onToggle={v => update({ notifyFollowers: v })} />
          <SettingRow label="comments on rounds" value={prefs.notifyComments} onToggle={v => update({ notifyComments: v })} />
          <SettingRow label="email notifications" description="weekly activity summary" value={prefs.emailNotifications} onToggle={v => update({ emailNotifications: v })} last />
        </View>

        {/* ── Measurements ── */}
        <SectionHeader title="measurements" />
        <Text style={styles.sectionNote}>overrides automatic detection based on location</Text>
        <View style={styles.card}>
          <RadioGroup
            options={['auto', 'km', 'mi'] as const}
            labels={{ auto: 'auto (detect from location)', km: 'kilometres (km)', mi: 'miles (mi)' }}
            value={prefs.distanceUnit}
            onChange={v => update({ distanceUnit: v })}
          />
        </View>

        {/* ── Account actions ── */}
        <SectionHeader title="" />
        <View style={styles.card}>
          <ActionRow label="sign out" onPress={handleSignOut} danger last />
        </View>

        <Text style={styles.version}>golf app · sdk 54</Text>
      </ScrollView>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </SafeAreaView>
  )
}
