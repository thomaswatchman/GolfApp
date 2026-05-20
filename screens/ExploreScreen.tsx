import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { Course, ConditionReview, CourseCondition } from '../types'

type ExploreTab = 'courses' | 'reviews' | 'map'

const MOCK_COURSES: Course[] = [
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
    name: 'Monterey Peninsula Country Club',
    location: 'Pebble Beach, CA',
    distanceAway: 4.8,
    holes: 18,
    type: 'private',
    starRating: 4.8,
    condition: 'Excellent',
    lat: 36.5534,
    lng: -121.9421,
  },
  {
    id: 'c4',
    name: 'Laguna Seca Golf Ranch',
    location: 'Monterey, CA',
    distanceAway: 7.2,
    holes: 18,
    type: 'public',
    starRating: 4.1,
    condition: 'Fair',
    lat: 36.5792,
    lng: -121.7535,
  },
  {
    id: 'c5',
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

const MOCK_REVIEWS: ConditionReview[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'James McKenna',
    courseId: 'c1',
    courseName: 'Pebble Beach Golf Links',
    condition: 'Excellent',
    text: 'Greens were absolutely perfect. Best conditions I have seen all year.',
    createdAt: '2h ago',
  },
  {
    id: 'r2',
    userId: 'u3',
    userName: 'Ryan Park',
    courseId: 'c4',
    courseName: 'Laguna Seca Golf Ranch',
    condition: 'Fair',
    text: "Fairways a bit patchy after last week's rain. Greens rolling well though.",
    createdAt: '6h ago',
  },
  {
    id: 'r3',
    userId: 'u2',
    userName: 'Sarah Callahan',
    courseId: 'c2',
    courseName: 'Spyglass Hill Golf Course',
    condition: 'Good',
    text: 'Great shape overall. Back nine greens are quicker than the front.',
    createdAt: '1d ago',
  },
  {
    id: 'r4',
    userId: 'u4',
    userName: 'Lauren Chu',
    courseId: 'c5',
    courseName: 'Poppy Hills Golf Course',
    condition: 'Good',
    text: 'Recently aerated but recovering nicely. Staff were very helpful.',
    createdAt: '2d ago',
  },
]

const CONDITION_COLOR: Record<CourseCondition, string> = {
  Excellent: colors.accent,
  Good: '#a8d8a8',
  Fair: '#e8c87a',
  Poor: colors.danger,
}

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.tabPill, active && styles.tabPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
    >
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <Text style={styles.stars}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)} {rating.toFixed(1)}
    </Text>
  )
}

function ConditionBadge({ condition }: { condition: CourseCondition }) {
  return (
    <View style={styles.conditionRow}>
      <View
        style={[
          styles.conditionDot,
          { backgroundColor: CONDITION_COLOR[condition] },
        ]}
      />
      <Text style={[styles.conditionText, { color: CONDITION_COLOR[condition] }]}>
        {condition}
      </Text>
    </View>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75}>
      <View style={styles.cardTopRow}>
        <Text style={styles.courseName} numberOfLines={1}>
          {course.name}
        </Text>
        <Text style={styles.distance}>{course.distanceAway} mi</Text>
      </View>
      <Text style={styles.location}>{course.location}</Text>
      <View style={styles.cardMetaRow}>
        <Text style={styles.metaText}>
          {course.holes} holes · {course.type}
        </Text>
        <StarRating rating={course.starRating} />
      </View>
      <ConditionBadge condition={course.condition} />
    </TouchableOpacity>
  )
}

function ReviewCard({ review }: { review: ConditionReview }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.reviewUser}>{review.userName}</Text>
        <Text style={styles.reviewTime}>{review.createdAt}</Text>
      </View>
      <Text style={styles.reviewCourse}>{review.courseName}</Text>
      <ConditionBadge condition={review.condition} />
      <Text style={styles.reviewText}>{review.text}</Text>
    </View>
  )
}

function MapPlaceholder() {
  return (
    <View style={styles.mapPlaceholder}>
      <Text style={styles.mapPlaceholderText}>map view</Text>
      <Text style={styles.mapPlaceholderSub}>
        requires expo-maps or react-native-maps
      </Text>
    </View>
  )
}

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('courses')
  const [search, setSearch] = useState('')

  const filteredCourses = MOCK_COURSES.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>explore</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="search courses"
          placeholderTextColor={colors.inactive}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabRow}>
        <TabPill
          label="courses"
          active={activeTab === 'courses'}
          onPress={() => setActiveTab('courses')}
        />
        <TabPill
          label="reviews"
          active={activeTab === 'reviews'}
          onPress={() => setActiveTab('reviews')}
        />
        <TabPill
          label="map"
          active={activeTab === 'map'}
          onPress={() => setActiveTab('map')}
        />
      </View>

      {activeTab === 'courses' && (
        <FlatList
          data={filteredCourses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <CourseCard course={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'reviews' && (
        <FlatList
          data={MOCK_REVIEWS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'map' && <MapPlaceholder />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textBright,
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textBright,
    fontSize: fontSize.md,
    minHeight: 44,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabPillText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: '400',
  },
  tabPillTextActive: {
    color: colors.bg,
    fontWeight: '500',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: TAB_BAR_HEIGHT + spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  courseName: {
    color: colors.textBright,
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  distance: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  location: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaText: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  stars: {
    color: colors.gold,
    fontSize: fontSize.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  conditionText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  reviewUser: {
    color: colors.textBright,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  reviewTime: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  reviewCourse: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  reviewText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mapPlaceholderText: {
    color: colors.muted,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  mapPlaceholderSub: {
    color: colors.inactive,
    fontSize: fontSize.sm,
  },
})
