import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing, radius, fontSize } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { Club } from '../../types'

const DEFAULT_CLUBS = [
  'Driver', '3 wood', '5 wood', '4 iron', '5 iron', '6 iron',
  '7 iron', '8 iron', '9 iron', 'PW', 'GW', 'SW', 'LW', 'Putter',
]

function ClubRow({
  club,
  onUpdate,
  onDelete,
}: {
  club: Club
  onUpdate: (name: string, yardage: number) => void
  onDelete: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(club.carryYardage))

  function commit() {
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdate(club.name, parsed)
    } else {
      setDraft(String(club.carryYardage))
    }
    setEditing(false)
  }

  return (
    <View style={styles.clubRow}>
      <Text style={styles.clubName}>{club.name}</Text>
      <View style={styles.clubRight}>
        {club.name === 'Putter' ? (
          <Text style={styles.clubYardageMuted}>—</Text>
        ) : editing ? (
          <TextInput
            style={styles.clubInput}
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} accessibilityRole="button">
            <Text style={styles.clubYardage}>{club.carryYardage > 0 ? `${club.carryYardage} yds` : '—'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(club.name)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${club.name}`}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function BagScreen() {
  const navigation = useNavigation()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newClubName, setNewClubName] = useState('')
  const [newClubYardage, setNewClubYardage] = useState('')

  const loadBag = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('clubs')
      .select('name, carry_yardage')
      .eq('user_id', user.id)
      .order('carry_yardage', { ascending: false })
    setClubs((data ?? []).map((c: any) => ({ name: c.name, carryYardage: c.carry_yardage })))
  }, [])

  useEffect(() => {
    loadBag().finally(() => setLoading(false))
  }, [loadBag])

  async function handleUpdate(name: string, yardage: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setClubs(prev => prev.map(c => c.name === name ? { ...c, carryYardage: yardage } : c))
    await supabase.from('clubs').update({ carry_yardage: yardage })
      .eq('user_id', user.id).eq('name', name)
  }

  async function handleDelete(name: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    Alert.alert('remove club', `Remove ${name} from your bag?`, [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'remove',
        style: 'destructive',
        onPress: async () => {
          setClubs(prev => prev.filter(c => c.name !== name))
          await supabase.from('clubs').delete()
            .eq('user_id', user.id).eq('name', name)
        },
      },
    ])
  }

  async function handleAddClub() {
    if (!newClubName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const yardage = parseInt(newClubYardage, 10) || 0
    const club: Club = { name: newClubName.trim(), carryYardage: yardage }
    setClubs(prev => [...prev, club].sort((a, b) => b.carryYardage - a.carryYardage))
    await supabase.from('clubs').upsert(
      { user_id: user.id, name: club.name, carry_yardage: club.carryYardage },
      { onConflict: 'user_id,name' }
    )
    setNewClubName('')
    setNewClubYardage('')
    setAdding(false)
  }

  async function handleSeedBag() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const defaultYardages: Record<string, number> = {
      'Driver': 260, '3 wood': 230, '5 wood': 210, '4 iron': 190,
      '5 iron': 178, '6 iron': 166, '7 iron': 154, '8 iron': 142,
      '9 iron': 129, 'PW': 116, 'GW': 100, 'SW': 84, 'LW': 68, 'Putter': 0,
    }
    const rows = DEFAULT_CLUBS.map(name => ({
      user_id: user.id, name, carry_yardage: defaultYardages[name] ?? 0,
    }))
    await supabase.from('clubs').upsert(rows, { onConflict: 'user_id,name' })
    await loadBag()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>my bag</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={c => c.name}
          renderItem={({ item }) => (
            <ClubRow club={item} onUpdate={handleUpdate} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>bag is empty</Text>
              <TouchableOpacity style={styles.seedBtn} onPress={handleSeedBag} activeOpacity={0.8}>
                <Text style={styles.seedBtnText}>load default clubs</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            clubs.length > 0 ? (
              <View style={styles.footer}>
                {adding ? (
                  <View style={styles.addForm}>
                    <TextInput
                      style={[styles.addInput, { flex: 2 }]}
                      placeholder="club name"
                      placeholderTextColor={colors.inactive}
                      value={newClubName}
                      onChangeText={setNewClubName}
                      autoFocus
                    />
                    <TextInput
                      style={[styles.addInput, { flex: 1 }]}
                      placeholder="yds"
                      placeholderTextColor={colors.inactive}
                      value={newClubYardage}
                      onChangeText={setNewClubYardage}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAddClub}>
                      <Text style={styles.addConfirmText}>add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addCancelBtn} onPress={() => setAdding(false)}>
                      <Text style={styles.addCancelText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)} activeOpacity={0.75}>
                    <Text style={styles.addBtnText}>+ add club</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      )}
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
  list: { paddingBottom: spacing.xxl },
  clubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clubName: { color: colors.textLight, fontSize: fontSize.md, flex: 1 },
  clubRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  clubYardage: {
    color: colors.accent, fontSize: fontSize.md, fontWeight: '500',
    minWidth: 64, textAlign: 'right', lineHeight: 44, minHeight: 44,
  },
  clubYardageMuted: { color: colors.inactive, fontSize: fontSize.md, minWidth: 64, textAlign: 'right' },
  clubInput: {
    color: colors.accent, fontSize: fontSize.md, fontWeight: '500',
    borderBottomWidth: 1, borderBottomColor: colors.accent,
    minWidth: 64, textAlign: 'right', paddingVertical: 2, minHeight: 44,
  },
  deleteBtn: { padding: spacing.sm, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.inactive, fontSize: fontSize.sm },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.lg },
  emptyTitle: { color: colors.muted, fontSize: fontSize.lg },
  seedBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.accent, borderRadius: radius.md, minHeight: 52, justifyContent: 'center',
  },
  seedBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '500' },
  footer: { padding: spacing.md },
  addBtn: {
    borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', minHeight: 52, justifyContent: 'center',
  },
  addBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '500' },
  addForm: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    color: colors.textBright, fontSize: fontSize.md, minHeight: 48,
  },
  addConfirmBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: spacing.md, minHeight: 48, justifyContent: 'center',
  },
  addConfirmText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '500' },
  addCancelBtn: { padding: spacing.sm, minHeight: 44, justifyContent: 'center' },
  addCancelText: { color: colors.muted, fontSize: fontSize.md },
})
