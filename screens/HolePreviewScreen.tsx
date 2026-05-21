import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { colors, spacing, radius, fontSize } from '../lib/theme'
import { RootStackParamList } from '../navigation/RootStack'

type RouteProps = RouteProp<RootStackParamList, 'HolePreview'>

// Placeholder 18-hole layout — replaced by a golf course API
// Par 72, 7,200 yards from tips
const PLACEHOLDER_HOLES = [
  { hole: 1,  par: 4, yardage: { black: 421, blue: 398, white: 371, gold: 342, red: 298 }, handicap: 7,  description: 'Slight dogleg right. Bunker guards the right side of the fairway.' },
  { hole: 2,  par: 5, yardage: { black: 563, blue: 541, white: 512, gold: 487, red: 441 }, handicap: 13, description: 'Long par 5. Reachable in two for longer hitters.' },
  { hole: 3,  par: 3, yardage: { black: 198, blue: 181, white: 163, gold: 148, red: 127 }, handicap: 17, description: 'Elevated tee to a well-bunkered green.' },
  { hole: 4,  par: 4, yardage: { black: 438, blue: 412, white: 389, gold: 361, red: 318 }, handicap: 3,  description: 'Demanding tee shot over water. Green slopes front to back.' },
  { hole: 5,  par: 4, yardage: { black: 405, blue: 383, white: 354, gold: 328, red: 291 }, handicap: 11, description: 'Straightforward hole with OB left. Favour the right side.' },
  { hole: 6,  par: 3, yardage: { black: 221, blue: 203, white: 179, gold: 158, red: 134 }, handicap: 15, description: 'Long par 3 requiring a precise mid-iron.' },
  { hole: 7,  par: 5, yardage: { black: 578, blue: 549, white: 521, gold: 493, red: 458 }, handicap: 9,  description: 'Risk/reward par 5. Water comes into play on the second shot.' },
  { hole: 8,  par: 4, yardage: { black: 448, blue: 421, white: 396, gold: 368, red: 324 }, handicap: 1,  description: 'Signature hole. Narrow fairway, difficult approach over water.' },
  { hole: 9,  par: 4, yardage: { black: 387, blue: 365, white: 341, gold: 316, red: 274 }, handicap: 5,  description: 'Strong finishing hole on the front nine.' },
  { hole: 10, par: 4, yardage: { black: 426, blue: 404, white: 376, gold: 350, red: 308 }, handicap: 6,  description: 'Back nine opener. Fairway bunker on the left at 230 yards.' },
  { hole: 11, par: 3, yardage: { black: 185, blue: 167, white: 148, gold: 131, red: 112 }, handicap: 16, description: 'Short par 3 but green is heavily contoured.' },
  { hole: 12, par: 5, yardage: { black: 541, blue: 516, white: 488, gold: 462, red: 421 }, handicap: 10, description: 'Reachable par 5 with a generous landing area.' },
  { hole: 13, par: 4, yardage: { black: 412, blue: 389, white: 362, gold: 337, red: 295 }, handicap: 4,  description: 'Dogleg left. Trees protect the inside of the corner.' },
  { hole: 14, par: 4, yardage: { black: 445, blue: 418, white: 393, gold: 365, red: 321 }, handicap: 2,  description: 'One of the toughest holes on the course. Long and demanding.' },
  { hole: 15, par: 3, yardage: { black: 203, blue: 184, white: 164, gold: 147, red: 123 }, handicap: 18, description: 'Island-style green surrounded by bunkers.' },
  { hole: 16, par: 4, yardage: { black: 398, blue: 374, white: 349, gold: 322, red: 281 }, handicap: 12, description: 'Driving hole — big hitters can cut the corner.' },
  { hole: 17, par: 5, yardage: { black: 556, blue: 528, white: 498, gold: 471, red: 438 }, handicap: 8,  description: 'Long par 5 with out of bounds all the way down the right.' },
  { hole: 18, par: 4, yardage: { black: 436, blue: 409, white: 384, gold: 356, red: 313 }, handicap: 14, description: 'Finishing hole in front of the clubhouse. Approach to a raised green.' },
]

type Tee = 'black' | 'blue' | 'white' | 'gold' | 'red'

const TEE_COLORS: Record<Tee, string> = {
  black: '#444', blue: '#3a7bd5', white: '#e8f5e8', gold: '#f0c040', red: '#e87a7a',
}

const TEE_TEXT: Record<Tee, string> = {
  black: colors.textBright, blue: colors.textBright, white: colors.bg, gold: colors.bg, red: colors.textBright,
}

const PAR_COLOR = (par: number, score?: number) => {
  if (!score) return colors.textBright
  const diff = score - par
  if (diff < -1) return '#a8d8ff'
  if (diff === -1) return colors.birdie
  if (diff === 0) return colors.textBright
  if (diff === 1) return colors.danger
  return '#e87a7a'
}

export default function HolePreviewScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProps>()
  const { courseName, tee: initialTee } = route.params

  const [selectedTee, setSelectedTee] = useState<Tee>(initialTee as Tee ?? 'black')
  const [selectedHole, setSelectedHole] = useState<number | null>(null)

  const tees: Tee[] = ['black', 'blue', 'white', 'gold', 'red']
  const totalYardage = PLACEHOLDER_HOLES.reduce((s, h) => s + h.yardage[selectedTee], 0)
  const totalPar = PLACEHOLDER_HOLES.reduce((s, h) => s + h.par, 0)
  const frontTotal = PLACEHOLDER_HOLES.slice(0, 9).reduce((s, h) => s + h.yardage[selectedTee], 0)
  const backTotal = PLACEHOLDER_HOLES.slice(9).reduce((s, h) => s + h.yardage[selectedTee], 0)

  const activeHole = selectedHole != null ? PLACEHOLDER_HOLES[selectedHole - 1] : null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{courseName}</Text>
          <Text style={styles.headerSub}>hole by hole</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tee selector */}
      <View style={styles.teeBar}>
        {tees.map(tee => (
          <TouchableOpacity
            key={tee}
            style={[styles.teeBtn, { borderColor: TEE_COLORS[tee] }, selectedTee === tee && { backgroundColor: TEE_COLORS[tee] }]}
            onPress={() => setSelectedTee(tee)}
            activeOpacity={0.75}
          >
            <Text style={[styles.teeBtnText, selectedTee === tee && { color: TEE_TEXT[tee] }]}>
              {tee}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalPar}</Text>
          <Text style={styles.summaryLabel}>par</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalYardage.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>yards total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{frontTotal}</Text>
          <Text style={styles.summaryLabel}>front 9</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{backTotal}</Text>
          <Text style={styles.summaryLabel}>back 9</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠ yardages are illustrative — course data integration coming soon
        </Text>
      </View>

      {/* Hole detail panel */}
      {activeHole && (
        <View style={styles.holePanel}>
          <View style={styles.holePanelHeader}>
            <Text style={styles.holePanelTitle}>hole {activeHole.hole}</Text>
            <Text style={styles.holePanelMeta}>
              par {activeHole.par} · {activeHole.yardage[selectedTee]} yds · hcp {activeHole.handicap}
            </Text>
          </View>
          <Text style={styles.holePanelDesc}>{activeHole.description}</Text>
        </View>
      )}

      {/* Scorecard grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Front 9 */}
        <View style={styles.nineSection}>
          <Text style={styles.nineLabel}>front nine</Text>
          <View style={styles.scorecardHeader}>
            <Text style={[styles.scCell, styles.scHole]}>hole</Text>
            <Text style={[styles.scCell, styles.scPar]}>par</Text>
            <Text style={[styles.scCell, styles.scYards]}>yards</Text>
            <Text style={[styles.scCell, styles.scHdcp]}>hcp</Text>
          </View>
          {PLACEHOLDER_HOLES.slice(0, 9).map(h => (
            <TouchableOpacity
              key={h.hole}
              style={[styles.scorecardRow, selectedHole === h.hole && styles.scorecardRowActive]}
              onPress={() => setSelectedHole(selectedHole === h.hole ? null : h.hole)}
              activeOpacity={0.75}
            >
              <View style={[styles.scCell, styles.scHole, styles.holeNumContainer]}>
                <View style={[styles.holeNum, selectedHole === h.hole && styles.holeNumActive]}>
                  <Text style={[styles.holeNumText, selectedHole === h.hole && styles.holeNumTextActive]}>
                    {h.hole}
                  </Text>
                </View>
              </View>
              <Text style={[styles.scCell, styles.scPar, styles.scText]}>{h.par}</Text>
              <Text style={[styles.scCell, styles.scYards, styles.scText]}>{h.yardage[selectedTee]}</Text>
              <Text style={[styles.scCell, styles.scHdcp, styles.scTextMuted]}>{h.handicap}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.nineTotal}>
            <Text style={[styles.scCell, styles.scHole, styles.nineTotalLabel]}>out</Text>
            <Text style={[styles.scCell, styles.scPar, styles.nineTotalValue]}>
              {PLACEHOLDER_HOLES.slice(0, 9).reduce((s, h) => s + h.par, 0)}
            </Text>
            <Text style={[styles.scCell, styles.scYards, styles.nineTotalValue]}>{frontTotal}</Text>
            <Text style={[styles.scCell, styles.scHdcp, styles.scTextMuted]} />
          </View>
        </View>

        {/* Back 9 */}
        <View style={styles.nineSection}>
          <Text style={styles.nineLabel}>back nine</Text>
          <View style={styles.scorecardHeader}>
            <Text style={[styles.scCell, styles.scHole]}>hole</Text>
            <Text style={[styles.scCell, styles.scPar]}>par</Text>
            <Text style={[styles.scCell, styles.scYards]}>yards</Text>
            <Text style={[styles.scCell, styles.scHdcp]}>hcp</Text>
          </View>
          {PLACEHOLDER_HOLES.slice(9).map(h => (
            <TouchableOpacity
              key={h.hole}
              style={[styles.scorecardRow, selectedHole === h.hole && styles.scorecardRowActive]}
              onPress={() => setSelectedHole(selectedHole === h.hole ? null : h.hole)}
              activeOpacity={0.75}
            >
              <View style={[styles.scCell, styles.scHole, styles.holeNumContainer]}>
                <View style={[styles.holeNum, selectedHole === h.hole && styles.holeNumActive]}>
                  <Text style={[styles.holeNumText, selectedHole === h.hole && styles.holeNumTextActive]}>
                    {h.hole}
                  </Text>
                </View>
              </View>
              <Text style={[styles.scCell, styles.scPar, styles.scText]}>{h.par}</Text>
              <Text style={[styles.scCell, styles.scYards, styles.scText]}>{h.yardage[selectedTee]}</Text>
              <Text style={[styles.scCell, styles.scHdcp, styles.scTextMuted]}>{h.handicap}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.nineTotal}>
            <Text style={[styles.scCell, styles.scHole, styles.nineTotalLabel]}>in</Text>
            <Text style={[styles.scCell, styles.scPar, styles.nineTotalValue]}>
              {PLACEHOLDER_HOLES.slice(9).reduce((s, h) => s + h.par, 0)}
            </Text>
            <Text style={[styles.scCell, styles.scYards, styles.nineTotalValue]}>{backTotal}</Text>
            <Text style={[styles.scCell, styles.scHdcp, styles.scTextMuted]} />
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={[styles.scCell, styles.scHole, styles.totalLabel]}>total</Text>
          <Text style={[styles.scCell, styles.scPar, styles.totalValue]}>{totalPar}</Text>
          <Text style={[styles.scCell, styles.scYards, styles.totalValue]}>{totalYardage.toLocaleString()}</Text>
          <Text style={[styles.scCell, styles.scHdcp]} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { minHeight: 44, justifyContent: 'center', minWidth: 60 },
  backText: { color: colors.accent, fontSize: fontSize.md },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  headerSub: { color: colors.muted, fontSize: fontSize.xs },
  headerRight: { minWidth: 60 },
  teeBar: {
    flexDirection: 'row', gap: spacing.xs, padding: spacing.sm,
    paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  teeBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1.5, minHeight: 30, justifyContent: 'center',
  },
  teeBtnText: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '500' },
  summaryBar: {
    flexDirection: 'row', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  summaryLabel: { color: colors.muted, fontSize: fontSize.xs },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  disclaimer: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  disclaimerText: { color: colors.inactive, fontSize: fontSize.xs },
  holePanel: {
    padding: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  holePanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  holePanelTitle: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  holePanelMeta: { color: colors.accent, fontSize: fontSize.sm },
  holePanelDesc: { color: colors.muted, fontSize: fontSize.sm, lineHeight: 20 },
  nineSection: { borderBottomWidth: 1, borderBottomColor: colors.border },
  nineLabel: {
    color: colors.muted, fontSize: fontSize.xs, fontWeight: '500',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  scorecardHeader: {
    flexDirection: 'row', paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  scorecardRow: {
    flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center',
  },
  scorecardRowActive: { backgroundColor: colors.surface },
  scCell: { textAlign: 'center' },
  scHole: { width: 48 },
  scPar: { flex: 1 },
  scYards: { flex: 1 },
  scHdcp: { width: 40 },
  scText: { color: colors.textLight, fontSize: fontSize.md },
  scTextMuted: { color: colors.inactive, fontSize: fontSize.sm },
  holeNumContainer: { alignItems: 'center' },
  holeNum: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  holeNumActive: { backgroundColor: colors.accent },
  holeNumText: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '500' },
  holeNumTextActive: { color: colors.bg },
  nineTotal: {
    flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  nineTotalLabel: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '500', textAlign: 'center' },
  nineTotalValue: { color: colors.textBright, fontSize: fontSize.sm, fontWeight: '500', flex: 1, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.borderLight, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  totalLabel: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500', textAlign: 'center' },
  totalValue: { color: colors.accent, fontSize: fontSize.md, fontWeight: '500', flex: 1, textAlign: 'center' },
})
