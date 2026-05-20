import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing, radius, fontSize } from '../../lib/theme'
import { supabase } from '../../lib/supabase'

interface Stats {
  roundsPlayed: number
  bestRound: number | null
  avgScore: number | null
  avgVsPar: number | null
  girPct: number | null
  fairwaysPct: number | null
  roundsThisYear: number
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

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: colors.accent }]}>{value}</Text>
    </View>
  )
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rounds } = await supabase
        .from('rounds')
        .select('gross_score, vs_par, gir_count, created_at')
        .eq('user_id', user.id)
        .not('gross_score', 'is', null)

      if (!rounds || rounds.length === 0) {
        setStats({ roundsPlayed: 0, bestRound: null, avgScore: null, avgVsPar: null, girPct: null, fairwaysPct: null, roundsThisYear: 0 })
        setLoading(false)
        return
      }

      const scores = rounds.map((r: any) => r.gross_score as number)
      const parDiffs = rounds.map((r: any) => r.vs_par as number)
      const thisYear = new Date().getFullYear()
      const roundsThisYear = rounds.filter((r: any) => new Date(r.created_at).getFullYear() === thisYear).length
      const girCounts = rounds.filter((r: any) => r.gir_count != null).map((r: any) => r.gir_count as number)

      setStats({
        roundsPlayed: rounds.length,
        bestRound: Math.min(...scores),
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        avgVsPar: Math.round((parDiffs.reduce((a, b) => a + b, 0) / parDiffs.length) * 10) / 10,
        girPct: girCounts.length > 0
          ? Math.round((girCounts.reduce((a, b) => a + b, 0) / girCounts.length / 18) * 100)
          : null,
        fairwaysPct: null,
        roundsThisYear,
      })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="statistics" />
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>scoring</Text>
            <StatRow label="rounds played" value={String(stats?.roundsPlayed ?? 0)} />
            <View style={styles.divider} />
            <StatRow label="best round" value={stats?.bestRound != null ? String(stats.bestRound) : '—'} accent />
            <View style={styles.divider} />
            <StatRow label="average score" value={stats?.avgScore != null ? String(stats.avgScore) : '—'} />
            <View style={styles.divider} />
            <StatRow
              label="average vs par"
              value={stats?.avgVsPar != null
                ? stats.avgVsPar > 0 ? `+${stats.avgVsPar}` : String(stats.avgVsPar)
                : '—'}
            />
            <View style={styles.divider} />
            <StatRow label="rounds this year" value={String(stats?.roundsThisYear ?? 0)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>ball striking</Text>
            <StatRow label="GIR %" value={stats?.girPct != null ? `${stats.girPct}%` : '—'} />
            <View style={styles.divider} />
            <StatRow label="fairways hit %" value={stats?.fairwaysPct != null ? `${stats.fairwaysPct}%` : '—'} />
          </View>

          <Text style={styles.note}>
            more detailed stats — strokes gained, proximity to hole, shot patterns — coming soon
          </Text>
        </ScrollView>
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
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  cardTitle: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    paddingVertical: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  statLabel: { color: colors.textLight, fontSize: fontSize.md },
  statValue: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  note: {
    color: colors.inactive,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
})
