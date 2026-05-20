import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { Club, Round } from '../types'

const DEFAULT_BAG: Club[] = [
  { name: 'Driver', carryYardage: 265 },
  { name: '3 wood', carryYardage: 235 },
  { name: '5 wood', carryYardage: 215 },
  { name: '4 iron', carryYardage: 195 },
  { name: '5 iron', carryYardage: 183 },
  { name: '6 iron', carryYardage: 170 },
  { name: '7 iron', carryYardage: 158 },
  { name: '8 iron', carryYardage: 146 },
  { name: '9 iron', carryYardage: 133 },
  { name: 'PW', carryYardage: 120 },
  { name: 'GW', carryYardage: 105 },
  { name: 'SW', carryYardage: 88 },
  { name: 'LW', carryYardage: 70 },
  { name: 'Putter', carryYardage: 0 },
]

const MOCK_PAST_ROUNDS: Pick<Round, 'id' | 'courseName' | 'date' | 'grossScore' | 'vsPar'>[] = [
  { id: 'r1', courseName: 'Pebble Beach Golf Links', date: 'May 18, 2026', grossScore: 78, vsPar: 6 },
  { id: 'r2', courseName: 'Spyglass Hill Golf Course', date: 'May 10, 2026', grossScore: 82, vsPar: 10 },
  { id: 'r3', courseName: 'Bethpage Black', date: 'Apr 30, 2026', grossScore: 76, vsPar: 5 },
  { id: 'r4', courseName: 'Torrey Pines Golf Course', date: 'Apr 20, 2026', grossScore: 80, vsPar: 8 },
  { id: 'r5', courseName: 'Augusta National Golf Club', date: 'Apr 11, 2026', grossScore: 74, vsPar: 2 },
]

const MOCK_USER = {
  name: 'Thomas Watchman',
  handicap: 7.4,
  roundsPlayed: 24,
  bestRound: 70,
  followingCount: 31,
  followersCount: 58,
}

function StatBlock({
  value,
  label,
}: {
  value: string | number
  label: string
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statBlockValue}>{value}</Text>
      <Text style={styles.statBlockLabel}>{label}</Text>
    </View>
  )
}

function ClubRow({
  club,
  onUpdateYardage,
}: {
  club: Club
  onUpdateYardage: (name: string, yardage: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(club.carryYardage))

  function commit() {
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateYardage(club.name, parsed)
    } else {
      setDraft(String(club.carryYardage))
    }
    setEditing(false)
  }

  if (club.name === 'Putter') {
    return (
      <View style={styles.clubRow}>
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.clubYardageMuted}>—</Text>
      </View>
    )
  }

  return (
    <View style={styles.clubRow}>
      <Text style={styles.clubName}>{club.name}</Text>
      {editing ? (
        <TextInput
          style={styles.clubYardageInput}
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
          <Text style={styles.clubYardage}>{club.carryYardage} yds</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function ProfileScreen() {
  const [bag, setBag] = useState(DEFAULT_BAG)
  const [bagExpanded, setBagExpanded] = useState(false)

  function updateYardage(name: string, yardage: number) {
    setBag(prev => prev.map(c => (c.name === name ? { ...c, carryYardage: yardage } : c)))
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {MOCK_USER.name
                .split(' ')
                .map(p => p[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.profileName}>{MOCK_USER.name}</Text>
          <View style={styles.handicapRow}>
            <Text style={styles.handicapLabel}>handicap index</Text>
            <Text style={styles.handicapValue}>{MOCK_USER.handicap.toFixed(1)}</Text>
          </View>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <StatBlock value={MOCK_USER.roundsPlayed} label="rounds" />
          <View style={styles.statsDivider} />
          <StatBlock value={MOCK_USER.bestRound ?? '—'} label="best round" />
          <View style={styles.statsDivider} />
          <StatBlock value={MOCK_USER.followingCount} label="following" />
          <View style={styles.statsDivider} />
          <StatBlock value={MOCK_USER.followersCount} label="followers" />
        </View>

        {/* My bag */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setBagExpanded(v => !v)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={bagExpanded ? 'Collapse bag' : 'Expand bag'}
          >
            <Text style={styles.sectionTitle}>my bag</Text>
            <Text style={styles.sectionChevron}>{bagExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {bagExpanded && (
            <View style={styles.bagList}>
              {bag.map(club => (
                <ClubRow
                  key={club.name}
                  club={club}
                  onUpdateYardage={updateYardage}
                />
              ))}
            </View>
          )}
        </View>

        {/* Past rounds */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>past rounds</Text>
          </View>
          <View style={styles.roundsList}>
            {MOCK_PAST_ROUNDS.map(round => {
              const vsPar = round.vsPar ?? 0
              const vsParLabel =
                vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
              const vsParColor =
                vsPar < 0
                  ? colors.birdie
                  : vsPar > 5
                    ? colors.danger
                    : colors.textLight
              return (
                <TouchableOpacity key={round.id} style={styles.roundRow} activeOpacity={0.75}>
                  <View style={styles.roundInfo}>
                    <Text style={styles.roundCourse} numberOfLines={1}>
                      {round.courseName}
                    </Text>
                    <Text style={styles.roundDate}>{round.date}</Text>
                  </View>
                  <View style={styles.roundScores}>
                    <Text style={[styles.roundVsPar, { color: vsParColor }]}>
                      {vsParLabel}
                    </Text>
                    <Text style={styles.roundGross}>{round.grossScore}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: TAB_BAR_HEIGHT + spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileAvatarText: {
    color: colors.textLight,
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  profileName: {
    color: colors.textBright,
    fontSize: fontSize.xl,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  handicapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  handicapLabel: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  handicapValue: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statBlockValue: {
    color: colors.textBright,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  statBlockLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  sectionTitle: {
    color: colors.textBright,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  sectionChevron: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  bagList: {
    paddingBottom: spacing.sm,
  },
  clubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clubName: {
    color: colors.textLight,
    fontSize: fontSize.md,
  },
  clubYardage: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
    minWidth: 70,
    textAlign: 'right',
    minHeight: 44,
    textAlignVertical: 'center',
    lineHeight: 44,
  },
  clubYardageMuted: {
    color: colors.inactive,
    fontSize: fontSize.md,
    minWidth: 70,
    textAlign: 'right',
  },
  clubYardageInput: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    minWidth: 70,
    textAlign: 'right',
    paddingVertical: 2,
    minHeight: 44,
  },
  roundsList: {
    paddingBottom: spacing.sm,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roundInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  roundCourse: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  roundDate: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  roundScores: {
    alignItems: 'flex-end',
  },
  roundVsPar: {
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  roundGross: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 1,
  },
})
