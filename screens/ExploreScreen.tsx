import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, Callout } from 'react-native-maps'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { ConditionReview, CourseCondition } from '../types'
import { supabase } from '../lib/supabase'
import { getNearbyGolfCourses, getCurrentLocation, PlacesCourse, DistanceUnit } from '../lib/placesApi'

type ExploreTab = 'courses' | 'reviews' | 'map'

const CONDITION_COLOR: Record<CourseCondition, string> = {
  Excellent: colors.accent,
  Good: '#a8d8a8',
  Fair: '#e8c87a',
  Poor: colors.danger,
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tabPill, active && styles.tabPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
    >
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <Text style={styles.stars}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)} {rating.toFixed(1)}
    </Text>
  )
}

function ConditionBadge({ condition }: { condition: CourseCondition }) {
  return (
    <View style={styles.conditionRow}>
      <View style={[styles.conditionDot, { backgroundColor: CONDITION_COLOR[condition] }]} />
      <Text style={[styles.conditionText, { color: CONDITION_COLOR[condition] }]}>{condition}</Text>
    </View>
  )
}

function PlacesCourseCard({
  course,
  unit,
  isSaved,
  onSave,
}: {
  course: PlacesCourse
  unit: DistanceUnit
  isSaved: boolean
  onSave: (course: PlacesCourse) => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.courseName} numberOfLines={1}>{course.name}</Text>
        <Text style={styles.distance}>{course.distance.toFixed(1)} {unit}</Text>
      </View>
      <Text style={styles.location}>{course.address}</Text>
      <View style={styles.cardBottomRow}>
        {course.rating != null && <StarRating rating={course.rating} />}
        <TouchableOpacity
          style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
          onPress={() => onSave(course)}
          disabled={isSaved}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Saved' : 'Save course'}
        >
          <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextSaved]}>
            {isSaved ? 'saved' : 'save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  )
}

function CourseMap({
  courses,
  userLatLng,
  savedIds,
  onToggleSave,
  unit,
}: {
  courses: PlacesCourse[]
  userLatLng: { lat: number; lng: number } | null
  savedIds: Set<string>
  onToggleSave: (c: PlacesCourse) => void
  unit: DistanceUnit
}) {
  const region = userLatLng
    ? { latitude: userLatLng.lat, longitude: userLatLng.lng, latitudeDelta: 0.35, longitudeDelta: 0.35 }
    : { latitude: 53.5461, longitude: -113.4938, latitudeDelta: 0.35, longitudeDelta: 0.35 }

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton
      userInterfaceStyle="dark"
    >
      {courses.map(course => {
        const isSaved = savedIds.has(course.placeId)
        return (
          <Marker
            key={course.placeId}
            coordinate={{ latitude: course.lat, longitude: course.lng }}
            pinColor={isSaved ? colors.accent : colors.muted}
          >
            <Callout tooltip onPress={() => onToggleSave(course)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{course.name}</Text>
                <Text style={styles.calloutSub}>{course.distance.toFixed(1)} {unit} away</Text>
                <Text style={isSaved ? styles.calloutSaved : styles.calloutSave}>
                  {isSaved ? '✓ saved — tap to unsave' : 'tap to save'}
                </Text>
              </View>
            </Callout>
          </Marker>
        )
      })}
    </MapView>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('courses')
  const [search, setSearch] = useState('')

  const [nearbyCourses, setNearbyCourses] = useState<PlacesCourse[]>([])
  const [unit, setUnit] = useState<DistanceUnit>('mi')
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null)
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [savedCourseIds, setSavedCourseIds] = useState<Set<string>>(new Set())
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)

  const [reviews, setReviews] = useState<ConditionReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadCourses = useCallback(async () => {
    setLocationError(null)
    const location = await getCurrentLocation()
    if (!location) {
      setLocationError('Location permission denied. Enable it in Settings to see nearby courses.')
      setLoadingCourses(false)
      return
    }
    setDetectedLocation(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
    setUserLatLng(location)
    const [nearbyResult, savedResult] = await Promise.all([
      getNearbyGolfCourses(location).catch((err: Error) => {
        setLocationError(`Could not load courses: ${err.message}`)
        return { courses: [] as PlacesCourse[], unit: 'mi' as DistanceUnit }
      }),
      supabase
        .from('saved_courses')
        .select('places_id')
        .then(({ data }) => new Set((data ?? []).map((r: any) => r.places_id as string))),
    ])

    setNearbyCourses(nearbyResult.courses)
    setUnit(nearbyResult.unit)
    setSavedCourseIds(savedResult)
    setLoadingCourses(false)
  }, [])

  const loadReviews = useCallback(async () => {
    const { data } = await supabase
      .from('condition_reviews')
      .select(`id, condition, text, created_at, courses (name), profiles (full_name)`)
      .order('created_at', { ascending: false })
      .limit(30)

    setReviews(
      (data ?? []).map((r: any) => ({
        id: r.id,
        userId: '',
        userName: r.profiles?.full_name ?? 'Unknown',
        courseId: '',
        courseName: r.courses?.name ?? 'Unknown course',
        condition: r.condition,
        text: r.text,
        createdAt: timeAgo(r.created_at),
      }))
    )
    setLoadingReviews(false)
  }, [])

  useEffect(() => {
    loadCourses()
    loadReviews()
  }, [loadCourses, loadReviews])

  async function handleRefresh() {
    setRefreshing(true)
    setLoadingCourses(true)
    setLoadingReviews(true)
    await Promise.all([loadCourses(), loadReviews()])
    setRefreshing(false)
  }

  async function handleToggleSave(course: PlacesCourse) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (savedCourseIds.has(course.placeId)) {
      await supabase
        .from('saved_courses')
        .delete()
        .eq('user_id', user.id)
        .eq('places_id', course.placeId)
      setSavedCourseIds(prev => {
        const next = new Set(prev)
        next.delete(course.placeId)
        return next
      })
      return
    }

    const { data: courseRow } = await supabase
      .from('courses')
      .upsert(
        { places_id: course.placeId, name: course.name, location: course.address, lat: course.lat, lng: course.lng },
        { onConflict: 'places_id', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (courseRow) {
      await supabase.from('saved_courses').upsert({
        user_id: user.id,
        course_id: courseRow.id,
        places_id: course.placeId,
        course_name: course.name,
        course_location: course.address,
      })
      setSavedCourseIds(prev => new Set([...prev, course.placeId]))
    }
  }

  const filteredCourses = nearbyCourses.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  )

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
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
        <TabPill label="courses" active={activeTab === 'courses'} onPress={() => setActiveTab('courses')} />
        <TabPill label="reviews" active={activeTab === 'reviews'} onPress={() => setActiveTab('reviews')} />
        <TabPill label="map" active={activeTab === 'map'} onPress={() => setActiveTab('map')} />
      </View>

      {activeTab === 'courses' && detectedLocation && !loadingCourses && (
        <Text style={styles.debugLocation}>📍 {detectedLocation} · {unit}</Text>
      )}

      {activeTab === 'courses' && (
        loadingCourses ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : locationError ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={item => item.placeId}
            renderItem={({ item }) => (
              <PlacesCourseCard
                course={item}
                unit={unit}
                isSaved={savedCourseIds.has(item.placeId)}
                onSave={handleToggleSave}
              />
            )}
            contentContainerStyle={[styles.list, filteredCourses.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState message="no courses found nearby" />}
            refreshControl={refreshControl}
          />
        )
      )}

      {activeTab === 'reviews' && (
        loadingReviews ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ReviewCard review={item} />}
            contentContainerStyle={[styles.list, reviews.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState message="no reviews yet" />}
            refreshControl={refreshControl}
          />
        )
      )}

      {activeTab === 'map' && (
        loadingCourses ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <CourseMap
            courses={nearbyCourses}
            userLatLng={userLatLng}
            savedIds={savedCourseIds}
            onToggleSave={handleToggleSave}
            unit={unit}
          />
        )
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500' },
  searchRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
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
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  tabPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabPillText: { color: colors.muted, fontSize: fontSize.sm },
  tabPillTextActive: { color: colors.bg, fontWeight: '500' },
  loader: { marginTop: spacing.xxl },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: TAB_BAR_HEIGHT + spacing.md },
  listEmpty: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted, fontSize: fontSize.md },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  errorText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  courseName: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500', flex: 1, marginRight: spacing.sm },
  distance: { color: colors.muted, fontSize: fontSize.sm },
  location: { color: colors.muted, fontSize: fontSize.sm },
  stars: { color: colors.gold, fontSize: fontSize.sm },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnSaved: { borderColor: colors.borderLight, backgroundColor: colors.borderLight },
  saveBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  saveBtnTextSaved: { color: colors.muted },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  conditionDot: { width: 8, height: 8, borderRadius: radius.full },
  conditionText: { fontSize: fontSize.sm, fontWeight: '500' },
  reviewUser: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  reviewTime: { color: colors.muted, fontSize: fontSize.sm },
  reviewCourse: { color: colors.muted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  reviewText: { color: colors.textLight, fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mapPlaceholderText: { color: colors.muted, fontSize: fontSize.lg, fontWeight: '500' },
  mapPlaceholderSub: { color: colors.inactive, fontSize: fontSize.sm },
  debugLocation: { color: colors.inactive, fontSize: fontSize.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  map: { flex: 1 },
  callout: {
    width: 200,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  calloutName: { color: colors.textBright, fontSize: fontSize.sm, fontWeight: '500', marginBottom: 2 },
  calloutSub: { color: colors.muted, fontSize: fontSize.xs },
  calloutSave: { color: colors.accent, fontSize: fontSize.xs, marginTop: spacing.xs, fontWeight: '500' },
  calloutSaved: { color: colors.muted, fontSize: fontSize.xs, marginTop: spacing.xs },
})
