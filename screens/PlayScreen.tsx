import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { GameMode, HoleScore, Course } from '../types'

type PlayState = 'setup_course' | 'setup_mode' | 'setup_players' | 'playing'

const MOCK_NEARBY_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    distanceAway: 2.4,
    holes: 18,
    type: 'public',
    starRating: 4.9,
    condition: 'Excellent',
    lat: 36.5675,
    lng: -121.9484,
  },
  {
    id: 'c2',
    name: 'Spyglass Hill Golf Course',
    location: 'Pebble Beach, CA',
    distanceAway: 3.1,
    holes: 18,
    type: 'semi-private',
    starRating: 4.7,
    condition: 'Good',
    lat: 36.5787,
    lng: -121.9612,
  },
  {
    id: 'c3',
    name: 'Poppy Hills Golf Course',
    location: 'Pebble Beach, CA',
    distanceAway: 5.5,
    holes: 18,
    type: 'public',
    starRating: 4.3,
    condition: 'Good',
    lat: 36.5883,
    lng: -121.9498,
  },
]

const HOLE_PARS = [4, 5, 3, 4, 3, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 4, 5, 4]

function initScores(): HoleScore[] {
  return HOLE_PARS.map((par, i) => ({
    hole: i + 1,
    par,
    strokes: null,
    fairwayHit: null,
    gir: null,
  }))
}

function ScoreChip({
  score,
  onPress,
  isCurrent,
}: {
  score: HoleScore
  onPress: () => void
  isCurrent: boolean
}) {
  const diff = score.strokes !== null ? score.strokes - score.par : null
  const bg =
    score.strokes === null
      ? isCurrent
        ? colors.accent
        : colors.border
      : diff! < 0
        ? colors.birdie
        : diff! > 0
          ? colors.danger
          : colors.borderLight

  const textColor =
    score.strokes === null
      ? isCurrent
        ? colors.bg
        : colors.inactive
      : colors.textBright

  return (
    <TouchableOpacity
      style={[styles.scoreChip, { backgroundColor: bg }, isCurrent && styles.scoreChipCurrent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.scoreChipHole, { color: isCurrent ? colors.bg : colors.muted }]}>
        {score.hole}
      </Text>
      <Text style={[styles.scoreChipScore, { color: textColor }]}>
        {score.strokes !== null ? score.strokes : '—'}
      </Text>
    </TouchableOpacity>
  )
}

function ScoreEntryModal({
  hole,
  par,
  current,
  onSave,
  onClose,
}: {
  hole: number
  par: number
  current: number | null
  onSave: (strokes: number) => void
  onClose: () => void
}) {
  const [val, setVal] = useState(current ?? par)
  return (
    <View style={styles.scoreModal}>
      <View style={styles.scoreModalCard}>
        <Text style={styles.scoreModalTitle}>hole {hole} · par {par}</Text>
        <View style={styles.scoreModalRow}>
          <TouchableOpacity
            style={styles.scoreStepBtn}
            onPress={() => setVal(v => Math.max(1, v - 1))}
            accessibilityRole="button"
            accessibilityLabel="Decrease score"
          >
            <Text style={styles.scoreStepText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.scoreModalValue}>{val}</Text>
          <TouchableOpacity
            style={styles.scoreStepBtn}
            onPress={() => setVal(v => v + 1)}
            accessibilityRole="button"
            accessibilityLabel="Increase score"
          >
            <Text style={styles.scoreStepText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scoreModalActions}>
          <TouchableOpacity style={styles.scoreModalCancel} onPress={onClose}>
            <Text style={styles.scoreModalCancelText}>cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scoreModalSave}
            onPress={() => { onSave(val); onClose() }}
          >
            <Text style={styles.scoreModalSaveText}>save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function SetupCourse({
  onSelect,
}: {
  onSelect: (course: Course) => void
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.setupHeader}>
        <Text style={styles.setupTitle}>select course</Text>
        <Text style={styles.setupSubtitle}>nearby</Text>
      </View>
      <FlatList
        data={MOCK_NEARBY_COURSES}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.setupList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.setupCard}
            onPress={() => onSelect(item)}
            activeOpacity={0.75}
          >
            <View style={styles.setupCardRow}>
              <Text style={styles.setupCardTitle}>{item.name}</Text>
              <Text style={styles.setupCardMeta}>{item.distanceAway} mi</Text>
            </View>
            <Text style={styles.setupCardSub}>{item.location}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

function SetupMode({
  course,
  onSelect,
  onBack,
}: {
  course: Course
  onSelect: (mode: GameMode) => void
  onBack: () => void
}) {
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
          <TouchableOpacity
            key={m.id}
            style={styles.setupCard}
            onPress={() => onSelect(m.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.setupCardTitle}>{m.label}</Text>
            <Text style={styles.setupCardSub}>{m.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

function PlayingView({
  course,
  gameMode,
  scores,
  currentHole,
  onScoreEntry,
  onLogShot,
}: {
  course: Course
  gameMode: GameMode
  scores: HoleScore[]
  currentHole: number
  onScoreEntry: (hole: number) => void
  onLogShot: () => void
}) {
  const hole = scores[currentHole - 1]
  const totalStrokes = scores
    .filter(s => s.strokes !== null)
    .reduce((sum, s) => sum + s.strokes!, 0)
  const totalPar = scores
    .filter(s => s.strokes !== null)
    .reduce((sum, s) => sum + s.par, 0)
  const vsPar = totalStrokes - totalPar
  const vsParLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
  const vsParColor =
    vsPar < 0 ? colors.birdie : vsPar > 3 ? colors.danger : colors.textBright

  return (
    <View style={styles.playingContainer}>
      {/* Map area */}
      <View style={styles.mapArea}>
        {/* Hole number + par overlay (top left) */}
        <View style={styles.holeOverlay}>
          <Text style={styles.holeNumber}>hole {currentHole}</Text>
          <Text style={styles.holePar}>par {hole.par}</Text>
        </View>

        {/* Distance overlay (top right) */}
        <View style={styles.distanceOverlay}>
          <Text style={styles.distancePrimary}>247</Text>
          <Text style={styles.distanceUnit}>yards</Text>
          <View style={styles.distanceSub}>
            <Text style={styles.distanceSubText}>F 238</Text>
            <Text style={styles.distanceSubText}>B 255</Text>
          </View>
        </View>

        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>hole map</Text>
          <Text style={styles.mapPlaceholderSub}>GPS · expo-location</Text>
        </View>

        {/* Score vs par (bottom of map) */}
        <View style={styles.scoreOverlay}>
          <Text style={[styles.scoreVsPar, { color: vsParColor }]}>
            {vsParLabel}
          </Text>
          <Text style={styles.scoreLabel}>through {currentHole - 1}</Text>
        </View>
      </View>

      {/* Scorecard strip */}
      <View style={styles.scorecardStrip}>
        <FlatList
          data={scores}
          keyExtractor={s => String(s.hole)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scorecardList}
          renderItem={({ item }) => (
            <ScoreChip
              score={item}
              isCurrent={item.hole === currentHole}
              onPress={() => onScoreEntry(item.hole)}
            />
          )}
        />
      </View>

      {/* Action buttons */}
      <SafeAreaView style={styles.playActions} edges={['bottom'] as any}>
        <TouchableOpacity
          style={styles.logShotBtn}
          onPress={onLogShot}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Log shot"
        >
          <Text style={styles.logShotText}>log shot</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.enterScoreBtn}
          onPress={() => onScoreEntry(currentHole)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Enter score"
        >
          <Text style={styles.enterScoreText}>enter score</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

export default function PlayScreen() {
  const [playState, setPlayState] = useState<PlayState>('setup_course')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('stroke')
  const [scores, setScores] = useState<HoleScore[]>(initScores())
  const [currentHole, setCurrentHole] = useState(1)
  const [scoreEntry, setScoreEntry] = useState<number | null>(null)

  function handleCourseSelect(course: Course) {
    setSelectedCourse(course)
    setPlayState('setup_mode')
  }

  function handleModeSelect(mode: GameMode) {
    setGameMode(mode)
    setPlayState('playing')
  }

  function handleSaveScore(hole: number, strokes: number) {
    setScores(prev =>
      prev.map(s => (s.hole === hole ? { ...s, strokes } : s))
    )
    if (hole === currentHole && hole < 18) {
      setCurrentHole(hole + 1)
    }
  }

  function handleLogShot() {
    // GPS shot logging — requires expo-location integration
  }

  if (playState === 'setup_course') {
    return <SetupCourse onSelect={handleCourseSelect} />
  }

  if (playState === 'setup_mode') {
    return (
      <SetupMode
        course={selectedCourse!}
        onSelect={handleModeSelect}
        onBack={() => setPlayState('setup_course')}
      />
    )
  }

  return (
    <>
      <PlayingView
        course={selectedCourse!}
        gameMode={gameMode}
        scores={scores}
        currentHole={currentHole}
        onScoreEntry={hole => setScoreEntry(hole)}
        onLogShot={handleLogShot}
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
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  setupHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setupTitle: {
    color: colors.textBright,
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  setupSubtitle: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  setupList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  setupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setupCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  setupCardTitle: {
    color: colors.textBright,
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  setupCardMeta: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  setupCardSub: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  backBtn: {
    marginBottom: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.accent,
    fontSize: fontSize.md,
  },
  // Playing view
  playingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#0d1a10',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  mapPlaceholderText: {
    color: colors.inactive,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  mapPlaceholderSub: {
    color: colors.border,
    fontSize: fontSize.sm,
  },
  holeOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    backgroundColor: 'rgba(15, 26, 18, 0.85)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  holeNumber: {
    color: colors.textBright,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  holePar: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  distanceOverlay: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
    backgroundColor: 'rgba(15, 26, 18, 0.85)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    minWidth: 90,
  },
  distancePrimary: {
    color: colors.textBright,
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 38,
  },
  distanceUnit: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  distanceSub: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  distanceSubText: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  scoreOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 26, 18, 0.85)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    zIndex: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scoreVsPar: {
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  scorecardStrip: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  scorecardList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  scoreChip: {
    width: 44,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChipCurrent: {
    borderWidth: 2,
    borderColor: colors.textBright,
  },
  scoreChipHole: {
    fontSize: 10,
    marginBottom: 1,
  },
  scoreChipScore: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  playActions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logShotBtn: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  logShotText: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  enterScoreBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  enterScoreText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  // Score entry modal
  scoreModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  scoreModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: 280,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scoreModalTitle: {
    color: colors.muted,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  scoreModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  scoreStepBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreStepText: {
    color: colors.textBright,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
  },
  scoreModalValue: {
    color: colors.textBright,
    fontSize: 48,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
  scoreModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  scoreModalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    justifyContent: 'center',
  },
  scoreModalCancelText: {
    color: colors.muted,
    fontSize: fontSize.md,
  },
  scoreModalSave: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  scoreModalSaveText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
})
