import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  SectionList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, radius, fontSize } from '../lib/theme'
import { GameMode, HoleScore } from '../types'
import { supabase } from '../lib/supabase'
import { getNearbyGolfCourses, getCurrentLocation, PlacesCourse } from '../lib/placesApi'

type PlayState = 'setup_course' | 'setup_mode' | 'playing'

const DEFAULT_PARS = [4, 5, 3, 4, 3, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 4, 5, 4]

interface SelectedCourse {
  id: string | null      // null if not yet in DB
  placeId: string | null
  name: string
  location: string
}

interface SavedCourse {
  id: string
  placeId: string | null
  name: string
  location: string
}

interface CourseListItem {
  key: string
  name: string
  subtitle: string
  badge: string | null
  onSelect: () => void
}

function initScores(pars: number[]): HoleScore[] {
  return pars.map((par, i) => ({ hole: i + 1, par, strokes: null, fairwayHit: null, gir: null }))
}

function ScoreChip({ score, isCurrent, onPress }: { score: HoleScore; isCurrent: boolean; onPress: () => void }) {
  const diff = score.strokes !== null ? score.strokes - score.par : null
  const bg =
    score.strokes === null
      ? isCurrent ? colors.accent : colors.border
      : diff! < 0 ? colors.birdie : diff! > 0 ? colors.danger : colors.borderLight

  return (
    <TouchableOpacity
      style={[styles.scoreChip, { backgroundColor: bg }, isCurrent && styles.scoreChipCurrent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.scoreChipHole, { color: isCurrent ? colors.bg : colors.muted }]}>
        {score.hole}
      </Text>
      <Text style={[styles.scoreChipScore, { color: isCurrent && score.strokes === null ? colors.bg : colors.textBright }]}>
        {score.strokes !== null ? score.strokes : '—'}
      </Text>
    </TouchableOpacity>
  )
}

function ScoreEntryModal({ hole, par, current, onSave, onClose }: {
  hole: number; par: number; current: number | null
  onSave: (s: number) => void; onClose: () => void
}) {
  const [val, setVal] = useState(current ?? par)
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>hole {hole} · par {par}</Text>
        <View style={styles.modalRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setVal(v => Math.max(1, v - 1))}>
            <Text style={styles.stepText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.modalValue}>{val}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setVal(v => v + 1)}>
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalSave} onPress={() => { onSave(val); onClose() }}>
            <Text style={styles.modalSaveText}>save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function SetupCourse({ onSelect }: { onSelect: (course: SelectedCourse) => void }) {
  const [nearbyCourses, setNearbyCourses] = useState<PlacesCourse[]>([])
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('mi')
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState(false)

  useEffect(() => {
    async function load() {
      const [locationResult, savedResult] = await Promise.all([
        getCurrentLocation(),
        supabase
          .from('saved_courses')
          .select('id, places_id, course_name, course_location')
          .order('created_at', { ascending: false }),
      ])

      if (locationResult) {
        const result = await getNearbyGolfCourses(locationResult).catch(() => ({ courses: [] as PlacesCourse[], unit: 'mi' as const }))
        setNearbyCourses(result.courses)
        setDistanceUnit(result.unit)
      } else {
        setLocationError(true)
      }

      setSavedCourses(
        (savedResult.data ?? []).map((c: any) => ({
          id: c.id,
          placeId: c.places_id,
          name: c.course_name,
          location: c.course_location ?? '',
        }))
      )

      setLoading(false)
    }
    load()
  }, [])

  const savedItems: CourseListItem[] = savedCourses.map(c => ({
    key: `saved-${c.id}`,
    name: c.name,
    subtitle: c.location,
    badge: 'saved',
    onSelect: () => onSelect({ id: c.id, placeId: c.placeId, name: c.name, location: c.location }),
  }))

  const nearbyItems: CourseListItem[] = nearbyCourses.map(c => ({
    key: `nearby-${c.placeId}`,
    name: c.name,
    subtitle: c.address,
    badge: `${c.distance.toFixed(1)} ${distanceUnit}`,
    onSelect: () => onSelect({ id: null, placeId: c.placeId, name: c.name, location: c.address }),
  }))

  const sections = [
    ...(savedItems.length > 0 ? [{ title: 'saved', data: savedItems }] : []),
    ...(nearbyItems.length > 0 ? [{ title: 'nearby', data: nearbyItems }] : []),
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.setupHeader}>
        <Text style={styles.setupTitle}>select course</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.setupList}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.setupCard} onPress={item.onSelect} activeOpacity={0.75}>
              <View style={styles.setupCardRow}>
                <Text style={styles.setupCardTitle}>{item.name}</Text>
                {item.badge === 'saved' ? (
                  <View style={styles.savedBadge}>
                    <Text style={styles.savedBadgeText}>saved</Text>
                  </View>
                ) : (
                  <Text style={styles.setupCardMeta}>{item.badge}</Text>
                )}
              </View>
              <Text style={styles.setupCardSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>no courses found</Text>
              <Text style={styles.emptyBody}>
                {locationError
                  ? 'Enable location access to see nearby courses.'
                  : 'Save courses in Explore to see them here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

function SetupMode({ course, onSelect, onBack }: { course: SelectedCourse; onSelect: (m: GameMode) => void; onBack: () => void }) {
  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: 'stroke', label: 'stroke play', desc: 'Standard gross score tracking' },
    { id: 'match', label: 'match play', desc: 'Hole-by-hole win / halve tracking' },
    { id: 'skins', label: 'skins', desc: 'Per-hole skins with carryover' },
  ]
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.setupHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← back</Text>
        </TouchableOpacity>
        <Text style={styles.setupTitle}>game mode</Text>
        <Text style={styles.setupSubtitle}>{course.name}</Text>
      </View>
      <View style={styles.setupList}>
        {modes.map(m => (
          <TouchableOpacity key={m.id} style={styles.setupCard} onPress={() => onSelect(m.id)} activeOpacity={0.75}>
            <Text style={styles.setupCardTitle}>{m.label}</Text>
            <Text style={styles.setupCardSub}>{m.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

function PlayingView({ course, gameMode, scores, currentHole, onScoreEntry, onLogShot }: {
  course: SelectedCourse; gameMode: GameMode; scores: HoleScore[]; currentHole: number
  onScoreEntry: (hole: number) => void; onLogShot: () => void
}) {
  const hole = scores[currentHole - 1]
  const played = scores.filter(s => s.strokes !== null)
  const vsPar = played.reduce((sum, s) => sum + s.strokes! - s.par, 0)
  const vsParLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
  const vsParColor = vsPar < 0 ? colors.birdie : vsPar > 3 ? colors.danger : colors.textBright

  return (
    <View style={styles.playingContainer}>
      <View style={styles.mapArea}>
        <View style={styles.holeOverlay}>
          <Text style={styles.holeNumber}>hole {currentHole}</Text>
          <Text style={styles.holePar}>par {hole.par}</Text>
        </View>
        <View style={styles.distanceOverlay}>
          <Text style={styles.distancePrimary}>—</Text>
          <Text style={styles.distanceUnit}>yards</Text>
          <View style={styles.distanceSub}>
            <Text style={styles.distanceSubText}>F —</Text>
            <Text style={styles.distanceSubText}>B —</Text>
          </View>
        </View>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>{course.name}</Text>
          <Text style={styles.mapPlaceholderSub}>hole {currentHole} map · GPS coming soon</Text>
        </View>
        <View style={styles.scoreOverlay}>
          <Text style={[styles.scoreVsPar, { color: vsParColor }]}>{vsParLabel}</Text>
          <Text style={styles.scoreLabel}>
            {played.length > 0 ? `through ${played.length}` : 'not started'} · {gameMode}
          </Text>
        </View>
      </View>

      <View style={styles.scorecardStrip}>
        <FlatList
          data={scores}
          keyExtractor={s => String(s.hole)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scorecardList}
          renderItem={({ item }) => (
            <ScoreChip score={item} isCurrent={item.hole === currentHole} onPress={() => onScoreEntry(item.hole)} />
          )}
        />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.playActions}>
        <TouchableOpacity style={styles.logShotBtn} onPress={onLogShot} activeOpacity={0.85}>
          <Text style={styles.logShotText}>log shot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.enterScoreBtn} onPress={() => onScoreEntry(currentHole)} activeOpacity={0.85}>
          <Text style={styles.enterScoreText}>enter score</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

export default function PlayScreen() {
  const [playState, setPlayState] = useState<PlayState>('setup_course')
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('stroke')
  const [scores, setScores] = useState<HoleScore[]>(initScores(DEFAULT_PARS))
  const [currentHole, setCurrentHole] = useState(1)
  const [scoreEntry, setScoreEntry] = useState<number | null>(null)

  function handleCourseSelect(course: SelectedCourse) {
    setSelectedCourse(course)
    setScores(initScores(DEFAULT_PARS))
    setCurrentHole(1)
    setPlayState('setup_mode')
  }

  function handleModeSelect(mode: GameMode) {
    setGameMode(mode)
    setPlayState('playing')
  }

  function handleSaveScore(hole: number, strokes: number) {
    setScores(prev => prev.map(s => s.hole === hole ? { ...s, strokes } : s))
    if (hole === currentHole && hole < 18) setCurrentHole(hole + 1)
  }

  if (playState === 'setup_course') {
    return <SetupCourse onSelect={handleCourseSelect} />
  }

  if (playState === 'setup_mode') {
    return <SetupMode course={selectedCourse!} onSelect={handleModeSelect} onBack={() => setPlayState('setup_course')} />
  }

  return (
    <>
      <PlayingView
        course={selectedCourse!}
        gameMode={gameMode}
        scores={scores}
        currentHole={currentHole}
        onScoreEntry={setScoreEntry}
        onLogShot={() => {}}
      />
      {scoreEntry !== null && (
        <ScoreEntryModal
          hole={scoreEntry}
          par={scores[scoreEntry - 1].par}
          current={scores[scoreEntry - 1].strokes}
          onSave={strokes => handleSaveScore(scoreEntry, strokes)}
          onClose={() => setScoreEntry(null)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  setupHeader: {
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  setupTitle: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500' },
  setupSubtitle: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  backBtn: { marginBottom: spacing.sm, minHeight: 44, justifyContent: 'center' },
  backBtnText: { color: colors.accent, fontSize: fontSize.md },
  loader: { marginTop: spacing.xxl },
  setupList: { padding: spacing.md, gap: spacing.sm },
  sectionLabel: {
    color: colors.muted, fontSize: fontSize.sm, fontWeight: '500',
    paddingVertical: spacing.sm, textTransform: 'lowercase',
  },
  listEmpty: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { color: colors.textLight, fontSize: fontSize.lg, fontWeight: '500' },
  emptyBody: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  setupCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  setupCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  setupCardTitle: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500', flex: 1, marginRight: spacing.sm },
  setupCardMeta: { color: colors.muted, fontSize: fontSize.sm },
  setupCardSub: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  savedBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    backgroundColor: colors.borderLight, borderRadius: radius.full,
  },
  savedBadgeText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '500' },
  playingContainer: { flex: 1, backgroundColor: colors.bg },
  mapArea: { flex: 1, position: 'relative' },
  mapPlaceholder: { flex: 1, backgroundColor: '#0d0f0d', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  mapPlaceholderText: { color: colors.inactive, fontSize: fontSize.md, fontWeight: '500' },
  mapPlaceholderSub: { color: colors.border, fontSize: fontSize.sm },
  holeOverlay: {
    position: 'absolute', top: spacing.lg, left: spacing.md,
    backgroundColor: 'rgba(17,17,17,0.88)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    zIndex: 10, borderWidth: 1, borderColor: colors.borderLight,
  },
  holeNumber: { color: colors.textBright, fontSize: fontSize.lg, fontWeight: '500' },
  holePar: { color: colors.muted, fontSize: fontSize.sm },
  distanceOverlay: {
    position: 'absolute', top: spacing.lg, right: spacing.md,
    backgroundColor: 'rgba(17,17,17,0.88)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    zIndex: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, minWidth: 90,
  },
  distancePrimary: { color: colors.textBright, fontSize: 36, fontWeight: '500', lineHeight: 38 },
  distanceUnit: { color: colors.muted, fontSize: fontSize.xs },
  distanceSub: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  distanceSubText: { color: colors.muted, fontSize: fontSize.xs },
  scoreOverlay: {
    position: 'absolute', bottom: spacing.sm, alignSelf: 'center',
    backgroundColor: 'rgba(17,17,17,0.88)', borderRadius: radius.full,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    zIndex: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
  },
  scoreVsPar: { fontSize: fontSize.xl, fontWeight: '500' },
  scoreLabel: { color: colors.muted, fontSize: fontSize.xs },
  scorecardStrip: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, paddingVertical: spacing.sm },
  scorecardList: { paddingHorizontal: spacing.md, gap: spacing.xs },
  scoreChip: { width: 44, height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  scoreChipCurrent: { borderWidth: 2, borderColor: colors.textBright },
  scoreChipHole: { fontSize: 10, marginBottom: 1 },
  scoreChipScore: { fontSize: fontSize.md, fontWeight: '500' },
  playActions: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  logShotBtn: {
    flex: 1, backgroundColor: colors.borderLight, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', minHeight: 52, justifyContent: 'center',
  },
  logShotText: { color: colors.textLight, fontSize: fontSize.md, fontWeight: '500' },
  enterScoreBtn: {
    flex: 1, backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', minHeight: 52, justifyContent: 'center',
  },
  enterScoreText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '500' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modalCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.xl, width: 280, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  modalTitle: { color: colors.muted, fontSize: fontSize.md, marginBottom: spacing.lg },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.lg },
  stepBtn: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.textBright, fontSize: 28, lineHeight: 30 },
  modalValue: { color: colors.textBright, fontSize: 48, fontWeight: '500', minWidth: 60, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  modalCancel: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, minHeight: 52, justifyContent: 'center',
  },
  modalCancelText: { color: colors.muted, fontSize: fontSize.md },
  modalSave: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    backgroundColor: colors.accent, borderRadius: radius.md, minHeight: 52, justifyContent: 'center',
  },
  modalSaveText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '500' },
})
