import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing, radius, fontSize } from '../../lib/theme'
import { supabase } from '../../lib/supabase'

interface PastRound {
  id: string
  courseName: string
  date: string
  gameMode: string
  grossScore: number | null
  vsPar: number | null
  girCount: number | null
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

function RoundCard({ round }: { round: PastRound }) {
  const vsPar = round.vsPar ?? 0
  const vsParLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
  const vsParColor = vsPar < 0 ? colors.birdie : vsPar > 5 ? colors.danger : colors.textLight

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.courseName}>{round.courseName}</Text>
          <Text style={styles.date}>{round.date} · {round.gameMode}</Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={[styles.vsPar, { color: vsParColor }]}>{vsParLabel}</Text>
          {round.grossScore != null && (
            <Text style={styles.gross}>{round.grossScore}</Text>
          )}
        </View>
      </View>

      {round.girCount != null && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{round.girCount}/18</Text>
            <Text style={styles.statLabel}>GIR</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default function PastRoundsScreen() {
  const [rounds, setRounds] = useState<PastRound[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRounds = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('rounds')
      .select('id, created_at, gross_score, vs_par, gir_count, game_mode, courses (name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setRounds(
      (data ?? []).map((r: any) => ({
        id: r.id,
        courseName: r.courses?.name ?? 'Unknown course',
        date: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
        gameMode: r.game_mode ?? 'stroke',
        grossScore: r.gross_score,
        vsPar: r.vs_par,
        girCount: r.gir_count,
      }))
    )
  }, [])

  useEffect(() => {
    loadRounds().finally(() => setLoading(false))
  }, [loadRounds])

  async function handleRefresh() {
    setRefreshing(true)
    await loadRounds()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="past rounds" />
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={rounds}
          keyExtractor={r => r.id}
          renderItem={({ item }) => <RoundCard round={item} />}
          contentContainerStyle={[styles.list, rounds.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>no rounds yet</Text>
              <Text style={styles.emptyBody}>complete a round in the Play tab to see it here</Text>
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
  listEmpty: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xxl },
  emptyTitle: { color: colors.textLight, fontSize: fontSize.lg, fontWeight: '500' },
  emptyBody: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, marginRight: spacing.md },
  courseName: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  date: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  scoreBlock: { alignItems: 'flex-end' },
  vsPar: { fontSize: fontSize.xl, fontWeight: '500' },
  gross: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { alignItems: 'center', marginRight: spacing.lg },
  statValue: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  statLabel: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
})
