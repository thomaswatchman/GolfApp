import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, SectionList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { spacing, radius, fontSize, ColorScheme } from '../lib/theme'
import { useTheme } from '../lib/ThemeContext'
import { GameMode, HoleScore } from '../types'
import { supabase } from '../lib/supabase'
import { getNearbyGolfCourses, getCurrentLocation, PlacesCourse } from '../lib/placesApi'

type PlayState = 'setup_course' | 'setup_mode' | 'playing'
const DEFAULT_PARS = [4, 5, 3, 4, 3, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 4, 5, 4]

interface SelectedCourse { id: string | null; placeId: string | null; name: string; location: string }
interface SavedCourse { id: string; placeId: string | null; name: string; location: string }
interface CourseListItem { key: string; name: string; subtitle: string; badge: string | null; onSelect: () => void }

function initScores(pars: number[]): HoleScore[] {
  return pars.map((par, i) => ({ hole: i + 1, par, strokes: null, fairwayHit: null, gir: null }))
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    setupHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
    setupTitle: { color: c.textBright, fontSize: fontSize.xl, fontWeight: '500' },
    setupSubtitle: { color: c.muted, fontSize: fontSize.sm, marginTop: 2 },
    backBtn: { marginBottom: spacing.sm, minHeight: 44, justifyContent: 'center' as const },
    backBtnText: { color: c.accent, fontSize: fontSize.md },
    loader: { marginTop: spacing.xxl },
    setupList: { padding: spacing.md, gap: spacing.sm },
    sectionLabel: { color: c.muted, fontSize: fontSize.sm, fontWeight: '500', paddingVertical: spacing.sm },
    listEmpty: { flex: 1 },
    empty: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing.sm, padding: spacing.xl },
    emptyTitle: { color: c.textLight, fontSize: fontSize.lg, fontWeight: '500' },
    emptyBody: { color: c.muted, fontSize: fontSize.sm, textAlign: 'center' as const, lineHeight: 20 },
    setupCard: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border },
    setupCardRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    setupCardTitle: { color: c.textBright, fontSize: fontSize.md, fontWeight: '500', flex: 1, marginRight: spacing.sm },
    setupCardMeta: { color: c.muted, fontSize: fontSize.sm },
    setupCardSub: { color: c.muted, fontSize: fontSize.sm, marginTop: 2 },
    savedBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, backgroundColor: c.borderLight, borderRadius: radius.full },
    savedBadgeText: { color: c.accent, fontSize: fontSize.xs, fontWeight: '500' },
    playingContainer: { flex: 1, backgroundColor: c.bg },
    mapArea: { flex: 1, position: 'relative' as const },
    mapPlaceholder: { flex: 1, backgroundColor: '#0d0f0d', alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing.xs },
    mapPlaceholderText: { color: c.inactive, fontSize: fontSize.md, fontWeight: '500' },
    mapPlaceholderSub: { color: c.border, fontSize: fontSize.sm },
    holeOverlay: { position: 'absolute' as const, top: spacing.lg, left: spacing.md, backgroundColor: 'rgba(17,17,17,0.88)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, zIndex: 10, borderWidth: 1, borderColor: c.borderLight },
    holeNumber: { color: c.textBright, fontSize: fontSize.lg, fontWeight: '500' },
    holePar: { color: c.muted, fontSize: fontSize.sm },
    distanceOverlay: { position: 'absolute' as const, top: spacing.lg, right: spacing.md, backgroundColor: 'rgba(17,17,17,0.88)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, zIndex: 10, alignItems: 'center' as const, borderWidth: 1, borderColor: c.borderLight, minWidth: 90 },
    distancePrimary: { color: c.textBright, fontSize: 36, fontWeight: '500', lineHeight: 38 },
    distanceUnit: { color: c.muted, fontSize: fontSize.xs },
    distanceSub: { flexDirection: 'row' as const, gap: spacing.sm, marginTop: spacing.xs },
    distanceSubText: { color: c.muted, fontSize: fontSize.xs },
    scoreOverlay: { position: 'absolute' as const, bottom: spacing.sm, alignSelf: 'center' as const, backgroundColor: 'rgba(17,17,17,0.88)', borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, zIndex: 10, alignItems: 'center' as const, borderWidth: 1, borderColor: c.borderLight },
    scoreVsPar: { fontSize: fontSize.xl, fontWeight: '500' },
    scoreLabel: { color: c.muted, fontSize: fontSize.xs },
    scorecardStrip: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface, paddingVertical: spacing.sm },
    scorecardList: { paddingHorizontal: spacing.md, gap: spacing.xs },
    scoreChip: { width: 44, height: 52, borderRadius: radius.sm, alignItems: 'center' as const, justifyContent: 'center' as const },
    scoreChipCurrent: { borderWidth: 2, borderColor: c.textBright },
    scoreChipHole: { fontSize: 10, marginBottom: 1 },
    scoreChipScore: { fontSize: fontSize.md, fontWeight: '500' },
    playActions: { flexDirection: 'row' as const, padding: spacing.md, gap: spacing.sm, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
    logShotBtn: { flex: 1, backgroundColor: c.borderLight, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' as const, minHeight: 52, justifyContent: 'center' as const },
    logShotText: { color: c.textLight, fontSize: fontSize.md, fontWeight: '500' },
    enterScoreBtn: { flex: 1, backgroundColor: c.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' as const, minHeight: 52, justifyContent: 'center' as const },
    enterScoreText: { color: c.bg, fontSize: fontSize.md, fontWeight: '500' },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 100 },
    modalCard: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.xl, width: 280, alignItems: 'center' as const, borderWidth: 1, borderColor: c.borderLight },
    modalTitle: { color: c.muted, fontSize: fontSize.md, marginBottom: spacing.lg },
    modalRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xl, marginBottom: spacing.lg },
    stepBtn: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: c.borderLight, alignItems: 'center' as const, justifyContent: 'center' as const },
    stepText: { color: c.textBright, fontSize: 28, lineHeight: 30 },
    modalValue: { color: c.textBright, fontSize: 48, fontWeight: '500', minWidth: 60, textAlign: 'center' as const },
    modalActions: { flexDirection: 'row' as const, gap: spacing.sm, width: '100%' },
    modalCancel: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' as const, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, minHeight: 52, justifyContent: 'center' as const },
    modalCancelText: { color: c.muted, fontSize: fontSize.md },
    modalSave: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' as const, backgroundColor: c.accent, borderRadius: radius.md, minHeight: 52, justifyContent: 'center' as const },
    modalSaveText: { color: c.bg, fontSize: fontSize.md, fontWeight: '500' },
  })
}

type Styles = ReturnType<typeof makeStyles>

function ScoreChip({ score, isCurrent, onPress, styles, c }: { score: HoleScore; isCurrent: boolean; onPress: () => void; styles: Styles; c: ColorScheme }) {
  const diff = score.strokes !== null ? score.strokes - score.par : null
  const bg = score.strokes === null ? (isCurrent ? c.accent : c.border) : diff! < 0 ? c.birdie : diff! > 0 ? c.danger : c.borderLight
  return (
    <TouchableOpacity style={[styles.scoreChip, { backgroundColor: bg }, isCurrent && styles.scoreChipCurrent]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.scoreChipHole, { color: isCurrent ? c.bg : c.muted }]}>{score.hole}</Text>
      <Text style={[styles.scoreChipScore, { color: isCurrent && score.strokes === null ? c.bg : c.textBright }]}>{score.strokes !== null ? score.strokes : '—'}</Text>
    </TouchableOpacity>
  )
}

function ScoreEntryModal({ hole, par, current, onSave, onClose, styles }: { hole: number; par: number; current: number | null; onSave: (s: number) => void; onClose: () => void; styles: Styles }) {
  const [val, setVal] = useState(current ?? par)
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>hole {hole} · par {par}</Text>
        <View style={styles.modalRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setVal(v => Math.max(1, v - 1))}><Text style={styles.stepText}>−</Text></TouchableOpacity>
          <Text style={styles.modalValue}>{val}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setVal(v => v + 1)}><Text style={styles.stepText}>+</Text></TouchableOpacity>
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}><Text style={styles.modalCancelText}>cancel</Text></TouchableOpacity>
          <TouchableOpacity style={styles.modalSave} onPress={() => { onSave(val); onClose() }}><Text style={styles.modalSaveText}>save</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function SetupCourse({ onSelect, styles, c }: { onSelect: (course: SelectedCourse) => void; styles: Styles; c: ColorScheme }) {
  const [nearbyCourses, setNearbyCourses] = useState<PlacesCourse[]>([])
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('mi')
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState(false)

  useEffect(() => {
    async function load() {
      const [locationResult, savedResult] = await Promise.all([
        getCurrentLocation(),
        supabase.from('saved_courses').select('id, places_id, course_name, course_location').order('created_at', { ascending: false }),
      ])
      if (locationResult) {
        const result = await getNearbyGolfCourses(locationResult).catch(() => ({ courses: [] as PlacesCourse[], unit: 'mi' as const }))
        setNearbyCourses(result.courses); setDistanceUnit(result.unit)
      } else { setLocationError(true) }
      setSavedCourses((savedResult.data ?? []).map((sc: any) => ({ id: sc.id, placeId: sc.places_id, name: sc.course_name, location: sc.course_location ?? '' })))
      setLoading(false)
    }
    load()
  }, [])

  const savedItems: CourseListItem[] = savedCourses.map(sc => ({ key: `saved-${sc.id}`, name: sc.name, subtitle: sc.location, badge: 'saved', onSelect: () => onSelect({ id: sc.id, placeId: sc.placeId, name: sc.name, location: sc.location }) }))
  const nearbyItems: CourseListItem[] = nearbyCourses.map(nc => ({ key: `nearby-${nc.placeId}`, name: nc.name, subtitle: nc.address, badge: `${nc.distance.toFixed(1)} ${distanceUnit}`, onSelect: () => onSelect({ id: null, placeId: nc.placeId, name: nc.name, location: nc.address }) }))
  const sections = [...(savedItems.length > 0 ? [{ title: 'saved', data: savedItems }] : []), ...(nearbyItems.length > 0 ? [{ title: 'nearby', data: nearbyItems }] : [])]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.setupHeader}><Text style={styles.setupTitle}>select course</Text></View>
      {loading ? <ActivityIndicator color={c.accent} style={styles.loader} /> : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.setupList}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => <Text style={styles.sectionLabel}>{section.title}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.setupCard} onPress={item.onSelect} activeOpacity={0.75}>
              <View style={styles.setupCardRow}>
                <Text style={styles.setupCardTitle}>{item.name}</Text>
                {item.badge === 'saved' ? <View style={styles.savedBadge}><Text style={styles.savedBadgeText}>saved</Text></View> : <Text style={styles.setupCardMeta}>{item.badge}</Text>}
              </View>
              <Text style={styles.setupCardSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>no courses found</Text><Text style={styles.emptyBody}>{locationError ? 'Enable location access to see nearby courses.' : 'Save courses in Explore to see them here.'}</Text></View>}
        />
      )}
    </SafeAreaView>
  )
}

function SetupMode({ course, onSelect, onBack, styles }: { course: SelectedCourse; onSelect: (m: GameMode) => void; onBack: () => void; styles: Styles }) {
  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: 'stroke', label: 'stroke play', desc: 'Standard gross score tracking' },
    { id: 'match', label: 'match play', desc: 'Hole-by-hole win / halve tracking' },
    { id: 'skins', label: 'skins', desc: 'Per-hole skins with carryover' },
  ]
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.setupHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Text style={styles.backBtnText}>← back</Text></TouchableOpacity>
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

function PlayingView({ course, gameMode, scores, currentHole, onScoreEntry, onLogShot, styles, c }: {
  course: SelectedCourse; gameMode: GameMode; scores: HoleScore[]; currentHole: number
  onScoreEntry: (hole: number) => void; onLogShot: () => void; styles: Styles; c: ColorScheme
}) {
  const hole = scores[currentHole - 1]
  const played = scores.filter(s => s.strokes !== null)
  const vsPar = played.reduce((sum, s) => sum + s.strokes! - s.par, 0)
  const vsParLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
  const vsParColor = vsPar < 0 ? c.birdie : vsPar > 3 ? c.danger : c.textBright

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
          <View style={styles.distanceSub}><Text style={styles.distanceSubText}>F —</Text><Text style={styles.distanceSubText}>B —</Text></View>
        </View>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>{course.name}</Text>
          <Text style={styles.mapPlaceholderSub}>hole {currentHole} map · GPS coming soon</Text>
        </View>
        <View style={styles.scoreOverlay}>
          <Text style={[styles.scoreVsPar, { color: vsParColor }]}>{vsParLabel}</Text>
          <Text style={styles.scoreLabel}>{played.length > 0 ? `through ${played.length}` : 'not started'} · {gameMode}</Text>
        </View>
      </View>
      <View style={styles.scorecardStrip}>
        <FlatList data={scores} keyExtractor={s => String(s.hole)} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scorecardList}
          renderItem={({ item }) => <ScoreChip score={item} isCurrent={item.hole === currentHole} onPress={() => onScoreEntry(item.hole)} styles={styles} c={c} />}
        />
      </View>
      <SafeAreaView edges={['bottom']} style={styles.playActions}>
        <TouchableOpacity style={styles.logShotBtn} onPress={onLogShot} activeOpacity={0.85}><Text style={styles.logShotText}>log shot</Text></TouchableOpacity>
        <TouchableOpacity style={styles.enterScoreBtn} onPress={() => onScoreEntry(currentHole)} activeOpacity={0.85}><Text style={styles.enterScoreText}>enter score</Text></TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

export default function PlayScreen() {
  const { colors: c } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const [playState, setPlayState] = useState<PlayState>('setup_course')
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('stroke')
  const [scores, setScores] = useState<HoleScore[]>(initScores(DEFAULT_PARS))
  const [currentHole, setCurrentHole] = useState(1)
  const [scoreEntry, setScoreEntry] = useState<number | null>(null)

  function handleCourseSelect(course: SelectedCourse) { setSelectedCourse(course); setScores(initScores(DEFAULT_PARS)); setCurrentHole(1); setPlayState('setup_mode') }
  function handleModeSelect(mode: GameMode) { setGameMode(mode); setPlayState('playing') }
  function handleSaveScore(hole: number, strokes: number) { setScores(prev => prev.map(s => s.hole === hole ? { ...s, strokes } : s)); if (hole === currentHole && hole < 18) setCurrentHole(hole + 1) }

  if (playState === 'setup_course') return <SetupCourse onSelect={handleCourseSelect} styles={styles} c={c} />
  if (playState === 'setup_mode') return <SetupMode course={selectedCourse!} onSelect={handleModeSelect} onBack={() => setPlayState('setup_course')} styles={styles} />

  return (
    <>
      <PlayingView course={selectedCourse!} gameMode={gameMode} scores={scores} currentHole={currentHole} onScoreEntry={setScoreEntry} onLogShot={() => {}} styles={styles} c={c} />
      {scoreEntry !== null && <ScoreEntryModal hole={scoreEntry} par={scores[scoreEntry - 1].par} current={scores[scoreEntry - 1].strokes} onSave={strokes => handleSaveScore(scoreEntry, strokes)} onClose={() => setScoreEntry(null)} styles={styles} />}
    </>
  )
}
