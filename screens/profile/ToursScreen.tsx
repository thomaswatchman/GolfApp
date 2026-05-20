import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing, radius, fontSize } from '../../lib/theme'
import { supabase } from '../../lib/supabase'

interface Tour {
  id: string
  name: string
  description: string | null
  memberCount: number
  isMember: boolean
}

function ScreenHeader({ title }: { title: string }) {
  const navigation = useNavigation()
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
        <Text style={styles.backText}>‹ back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  )
}

function TourCard({ tour, onToggle }: { tour: Tour; onToggle: (id: string) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.tourName}>{tour.name}</Text>
          {tour.description && (
            <Text style={styles.tourDesc}>{tour.description}</Text>
          )}
          <Text style={styles.memberCount}>{tour.memberCount} member{tour.memberCount !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, tour.isMember && styles.leaveBtn]}
          onPress={() => onToggle(tour.id)}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Text style={[styles.joinBtnText, tour.isMember && styles.leaveBtnText]}>
            {tour.isMember ? 'leave' : 'join'}
          </Text>
        </TouchableOpacity>
      </View>
      {tour.isMember && (
        <View style={styles.leaderboard}>
          <Text style={styles.leaderboardTitle}>leaderboard</Text>
          <Text style={styles.leaderboardEmpty}>play a round to appear on the leaderboard</Text>
        </View>
      )}
    </View>
  )
}

export default function ToursScreen() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTourName, setNewTourName] = useState('')

  const loadTours = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: allTours } = await supabase
      .from('tours')
      .select('id, name, description, member_count')
      .order('member_count', { ascending: false })

    const { data: myMemberships } = await supabase
      .from('tour_members')
      .select('tour_id')
      .eq('user_id', user.id)

    const memberOf = new Set((myMemberships ?? []).map((m: any) => m.tour_id))

    setTours(
      (allTours ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        memberCount: t.member_count ?? 0,
        isMember: memberOf.has(t.id),
      }))
    )
  }, [])

  useEffect(() => {
    loadTours().finally(() => setLoading(false))
  }, [loadTours])

  async function handleRefresh() {
    setRefreshing(true)
    await loadTours()
    setRefreshing(false)
  }

  async function handleToggleMembership(tourId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tour = tours.find(t => t.id === tourId)
    if (!tour) return

    if (tour.isMember) {
      await supabase.from('tour_members').delete()
        .eq('user_id', user.id).eq('tour_id', tourId)
      await supabase.from('tours').update({ member_count: Math.max((tour.memberCount) - 1, 0) }).eq('id', tourId)
    } else {
      await supabase.from('tour_members').insert({ user_id: user.id, tour_id: tourId })
      await supabase.from('tours').update({ member_count: tour.memberCount + 1 }).eq('id', tourId)
    }

    setTours(prev => prev.map(t =>
      t.id === tourId
        ? { ...t, isMember: !t.isMember, memberCount: t.isMember ? t.memberCount - 1 : t.memberCount + 1 }
        : t
    ))
  }

  async function handleCreateTour() {
    if (!newTourName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('tours')
      .insert({ name: newTourName.trim(), created_by: user.id, member_count: 1 })
      .select('id')
      .single()

    if (error || !data) {
      Alert.alert('error', 'could not create tour')
      return
    }

    await supabase.from('tour_members').insert({ user_id: user.id, tour_id: data.id })
    setNewTourName('')
    setCreating(false)
    await loadTours()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="tours" />
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={tours}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TourCard tour={item} onToggle={handleToggleMembership} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>no tours yet</Text>
              <Text style={styles.emptyBody}>create one below to get started</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.createSection}>
              {creating ? (
                <View style={styles.createForm}>
                  <TextInput
                    style={styles.createInput}
                    placeholder="tour name"
                    placeholderTextColor={colors.inactive}
                    value={newTourName}
                    onChangeText={setNewTourName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCreateTour}
                  />
                  <View style={styles.createActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreating(false)}>
                      <Text style={styles.cancelBtnText}>cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateTour}>
                      <Text style={styles.confirmBtnText}>create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.createBtn} onPress={() => setCreating(true)} activeOpacity={0.75}>
                  <Text style={styles.createBtnText}>+ create tour</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
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
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { color: colors.textLight, fontSize: fontSize.lg, fontWeight: '500' },
  emptyBody: { color: colors.muted, fontSize: fontSize.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: spacing.md },
  tourName: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  tourDesc: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  memberCount: { color: colors.inactive, fontSize: fontSize.xs, marginTop: spacing.xs },
  joinBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  leaveBtn: { borderColor: colors.borderLight, backgroundColor: colors.borderLight },
  joinBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  leaveBtnText: { color: colors.muted },
  leaderboard: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  leaderboardTitle: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm },
  leaderboardEmpty: { color: colors.inactive, fontSize: fontSize.sm },
  createSection: { paddingTop: spacing.md },
  createBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  createBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '500' },
  createForm: { gap: spacing.sm },
  createInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textBright,
    fontSize: fontSize.md,
    minHeight: 52,
  },
  createActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    justifyContent: 'center',
  },
  cancelBtnText: { color: colors.muted, fontSize: fontSize.md },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  confirmBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '500' },
})
