import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/RootStack'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, Callout } from 'react-native-maps'
import { spacing, radius, fontSize, TAB_BAR_HEIGHT, ColorScheme } from '../lib/theme'
import { useTheme } from '../lib/ThemeContext'
import { ConditionReview, CourseCondition } from '../types'
import { supabase } from '../lib/supabase'
import { getNearbyGolfCourses, getCurrentLocation, fetchCoursesAt, distanceKm, PlacesCourse, DistanceUnit, INITIAL_RADIUS_KM, EXPANDED_RADIUS_KM, MAP_MAX_LATITUDE_DELTA } from '../lib/placesApi'

type ExploreTab = 'courses' | 'reviews' | 'map'

const CONDITION_STATIC: Record<CourseCondition, string> = { Excellent: '#5db85d', Good: '#a8d8a8', Fair: '#e8c87a', Poor: '#e87a7a' }

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
    headerTitle: { color: c.textBright, fontSize: fontSize.xl, fontWeight: '500' },
    searchRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    searchInput: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: c.textBright, fontSize: fontSize.md, minHeight: 44 },
    tabRow: { flexDirection: 'row' as const, paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
    tabPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: c.border, minHeight: 36, justifyContent: 'center' as const },
    tabPillActive: { backgroundColor: c.accent, borderColor: c.accent },
    tabPillText: { color: c.muted, fontSize: fontSize.sm },
    tabPillTextActive: { color: c.bg, fontWeight: '500' },
    loader: { marginTop: spacing.xxl },
    list: { padding: spacing.md, gap: spacing.sm, paddingBottom: TAB_BAR_HEIGHT + spacing.md },
    listEmpty: { flex: 1 },
    empty: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    emptyText: { color: c.muted, fontSize: fontSize.md },
    errorState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: spacing.xl },
    errorText: { color: c.muted, fontSize: fontSize.sm, textAlign: 'center' as const, lineHeight: 22 },
    card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border },
    cardTopRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 2 },
    cardBottomRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: spacing.sm },
    courseName: { color: c.textBright, fontSize: fontSize.md, fontWeight: '500', flex: 1, marginRight: spacing.sm },
    distance: { color: c.muted, fontSize: fontSize.sm },
    location: { color: c.muted, fontSize: fontSize.sm },
    stars: { color: c.gold, fontSize: fontSize.sm },
    saveBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: c.accent, minHeight: 30, justifyContent: 'center' as const, alignItems: 'center' as const },
    saveBtnSaved: { borderColor: c.borderLight, backgroundColor: c.borderLight },
    saveBtnText: { color: c.accent, fontSize: fontSize.sm, fontWeight: '500' },
    saveBtnTextSaved: { color: c.muted },
    conditionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs },
    conditionDot: { width: 8, height: 8, borderRadius: radius.full },
    conditionText: { fontSize: fontSize.sm, fontWeight: '500' },
    reviewUser: { color: c.textBright, fontSize: fontSize.md, fontWeight: '500' },
    reviewTime: { color: c.muted, fontSize: fontSize.sm },
    reviewCourse: { color: c.muted, fontSize: fontSize.sm, marginBottom: spacing.sm },
    reviewText: { color: c.textLight, fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
    debugLocation: { color: c.inactive, fontSize: fontSize.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
    map: { flex: 1 },
    callout: { width: 200, padding: spacing.sm, backgroundColor: c.surface, borderRadius: radius.md },
    calloutName: { color: c.textBright, fontSize: fontSize.sm, fontWeight: '500', marginBottom: 2 },
    calloutSub: { color: c.muted, fontSize: fontSize.xs },
    calloutSave: { color: c.accent, fontSize: fontSize.xs, marginTop: spacing.xs, fontWeight: '500' },
    footerNote: { color: c.inactive, fontSize: fontSize.xs, textAlign: 'center' as const, paddingVertical: spacing.md },
    mapOverlay: { position: 'absolute' as const, bottom: spacing.md, alignSelf: 'center' as const, backgroundColor: 'rgba(17,17,17,0.8)', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm },
    mapOverlayText: { color: c.textLight, fontSize: fontSize.sm },
  })
}

type Styles = ReturnType<typeof makeStyles>

function TabPill({ label, active, onPress, styles }: { label: string; active: boolean; onPress: () => void; styles: Styles }) {
  return (
    <TouchableOpacity style={[styles.tabPill, active && styles.tabPillActive]} onPress={onPress} activeOpacity={0.7} accessibilityRole="tab">
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function StarRating({ rating, styles }: { rating: number; styles: Styles }) {
  const full = Math.round(rating)
  return <Text style={styles.stars}>{'★'.repeat(full)}{'☆'.repeat(5 - full)} {rating.toFixed(1)}</Text>
}

function ConditionBadge({ condition, styles }: { condition: CourseCondition; styles: Styles }) {
  return (
    <View style={styles.conditionRow}>
      <View style={[styles.conditionDot, { backgroundColor: CONDITION_STATIC[condition] }]} />
      <Text style={[styles.conditionText, { color: CONDITION_STATIC[condition] }]}>{condition}</Text>
    </View>
  )
}

function PlacesCourseCard({ course, unit, isSaved, onSave, onPress, styles }: { course: PlacesCourse; unit: DistanceUnit; isSaved: boolean; onSave: (c: PlacesCourse) => void; onPress: () => void; styles: Styles }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTopRow}>
        <Text style={styles.courseName} numberOfLines={1}>{course.name}</Text>
        <Text style={styles.distance}>{course.distance.toFixed(1)} {unit}</Text>
      </View>
      <Text style={styles.location}>{course.address}</Text>
      <View style={styles.cardBottomRow}>
        {course.rating != null && <StarRating rating={course.rating} styles={styles} />}
        <TouchableOpacity style={[styles.saveBtn, isSaved && styles.saveBtnSaved]} onPress={e => { e.stopPropagation?.(); onSave(course) }} accessibilityRole="button">
          <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextSaved]}>{isSaved ? '✓ saved' : 'save'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

function ReviewCard({ review, styles }: { review: ConditionReview; styles: Styles }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.reviewUser}>{review.userName}</Text>
        <Text style={styles.reviewTime}>{review.createdAt}</Text>
      </View>
      <Text style={styles.reviewCourse}>{review.courseName}</Text>
      <ConditionBadge condition={review.condition} styles={styles} />
      <Text style={styles.reviewText}>{review.text}</Text>
    </View>
  )
}

function CourseMap({ courses, userLatLng, savedIds, onRegionChange, loadingMap, unit, styles }: {
  courses: PlacesCourse[]; userLatLng: { lat: number; lng: number } | null; savedIds: Set<string>
  onRegionChange: (lat: number, lng: number, latDelta: number) => void; loadingMap: boolean; unit: DistanceUnit; styles: Styles
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { colors: c } = useTheme()
  const initialRegion = userLatLng
    ? { latitude: userLatLng.lat, longitude: userLatLng.lng, latitudeDelta: 0.35, longitudeDelta: 0.35 }
    : { latitude: 53.5461, longitude: -113.4938, latitudeDelta: 0.35, longitudeDelta: 0.35 }

  return (
    <View style={{ flex: 1 }}>
      <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation showsMyLocationButton userInterfaceStyle="dark" onRegionChangeComplete={r => onRegionChange(r.latitude, r.longitude, r.latitudeDelta)}>
        {courses.map(course => {
          const isSaved = savedIds.has(course.placeId)
          return (
            <Marker key={course.placeId} coordinate={{ latitude: course.lat, longitude: course.lng }} pinColor={isSaved ? c.accent : c.muted}>
              <Callout tooltip onPress={() => navigation.navigate('CourseDetail', { placeId: course.placeId, name: course.name, address: course.address, lat: course.lat, lng: course.lng, distance: course.distance, unit, rating: course.rating, isSaved })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{course.name}</Text>
                  <Text style={styles.calloutSub}>{course.distance.toFixed(1)} {unit} away{course.rating != null ? `  ★ ${course.rating.toFixed(1)}` : ''}</Text>
                  <Text style={styles.calloutSave}>tap to view →</Text>
                </View>
              </Callout>
            </Marker>
          )
        })}
      </MapView>
      {loadingMap && <View style={styles.mapOverlay}><ActivityIndicator color={c.accent} /></View>}
    </View>
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
  const { colors: c } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [activeTab, setActiveTab] = useState<ExploreTab>('courses')
  const [search, setSearch] = useState('')
  const [nearbyCourses, setNearbyCourses] = useState<PlacesCourse[]>([])
  const [unit, setUnit] = useState<DistanceUnit>('mi')
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null)
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [savedCourseIds, setSavedCourseIds] = useState<Set<string>>(new Set())
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadedRadiusKm, setLoadedRadiusKm] = useState(INITIAL_RADIUS_KM)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMap, setLoadingMap] = useState(false)
  const [mapTooFarOut, setMapTooFarOut] = useState(false)
  const fetchedCenters = useRef<Array<{ lat: number; lng: number }>>([])
  const mapFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reviews, setReviews] = useState<ConditionReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadCourses = useCallback(async () => {
    setLocationError(null); setLoadedRadiusKm(INITIAL_RADIUS_KM); setHasMore(true)
    const location = await getCurrentLocation()
    if (!location) { setLocationError('Location permission denied.'); setLoadingCourses(false); return }
    setDetectedLocation(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
    setUserLatLng(location)
    const [nearbyResult, savedResult] = await Promise.all([
      getNearbyGolfCourses(location, INITIAL_RADIUS_KM).catch((err: Error) => { setLocationError(`Could not load courses: ${err.message}`); return { courses: [] as PlacesCourse[], unit: 'mi' as DistanceUnit, hasMore: false } }),
      supabase.from('saved_courses').select('places_id').then(({ data }) => new Set((data ?? []).map((r: any) => r.places_id as string))),
    ])
    setNearbyCourses(nearbyResult.courses); setUnit(nearbyResult.unit); setHasMore(nearbyResult.hasMore)
    setSavedCourseIds(savedResult); setLoadingCourses(false)
  }, [])

  const handleMapRegionChange = useCallback((lat: number, lng: number, latDelta: number) => {
    setMapTooFarOut(latDelta > MAP_MAX_LATITUDE_DELTA)
    if (latDelta > MAP_MAX_LATITUDE_DELTA) return
    if (mapFetchTimer.current) clearTimeout(mapFetchTimer.current)
    mapFetchTimer.current = setTimeout(async () => {
      if (fetchedCenters.current.some(p => distanceKm(p.lat, p.lng, lat, lng) < 10)) return
      fetchedCenters.current.push({ lat, lng })
      setLoadingMap(true)
      const existingIds = new Set(nearbyCourses.map(p => p.placeId))
      const newCourses = await fetchCoursesAt({ lat, lng }, unit, existingIds).catch(() => [] as PlacesCourse[])
      if (newCourses.length > 0) setNearbyCourses(prev => { const ids = new Set(prev.map(p => p.placeId)); return [...prev, ...newCourses.filter(p => !ids.has(p.placeId))] })
      setLoadingMap(false)
    }, 600)
  }, [nearbyCourses, unit])

  const loadMoreCourses = useCallback(async () => {
    if (!userLatLng || loadingMore || !hasMore || loadedRadiusKm >= EXPANDED_RADIUS_KM) return
    setLoadingMore(true)
    const result = await getNearbyGolfCourses(userLatLng, EXPANDED_RADIUS_KM, new Set(nearbyCourses.map(p => p.placeId))).catch(() => null)
    if (result) { setNearbyCourses(prev => [...prev, ...result.courses]); setHasMore(false); setLoadedRadiusKm(EXPANDED_RADIUS_KM) }
    setLoadingMore(false)
  }, [userLatLng, loadingMore, hasMore, loadedRadiusKm, nearbyCourses])

  const loadReviews = useCallback(async () => {
    const { data } = await supabase.from('condition_reviews').select('id, condition, text, created_at, courses (name), profiles (full_name)').order('created_at', { ascending: false }).limit(30)
    setReviews((data ?? []).map((r: any) => ({ id: r.id, userId: '', userName: r.profiles?.full_name ?? 'Unknown', courseId: '', courseName: r.courses?.name ?? 'Unknown course', condition: r.condition, text: r.text, createdAt: timeAgo(r.created_at) })))
    setLoadingReviews(false)
  }, [])

  useEffect(() => { loadCourses(); loadReviews() }, [loadCourses, loadReviews])

  async function handleToggleSave(course: PlacesCourse) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (savedCourseIds.has(course.placeId)) {
      await supabase.from('saved_courses').delete().eq('user_id', user.id).eq('places_id', course.placeId)
      setSavedCourseIds(prev => { const n = new Set(prev); n.delete(course.placeId); return n })
      return
    }
    const { data: courseRow } = await supabase.from('courses').upsert({ places_id: course.placeId, name: course.name, location: course.address, lat: course.lat, lng: course.lng }, { onConflict: 'places_id', ignoreDuplicates: false }).select('id').single()
    if (courseRow) {
      await supabase.from('saved_courses').upsert({ user_id: user.id, course_id: courseRow.id, places_id: course.placeId, course_name: course.name, course_location: course.address })
      setSavedCourseIds(prev => new Set([...prev, course.placeId]))
    }
  }

  const filteredCourses = nearbyCourses.filter(course => course.name.toLowerCase().includes(search.toLowerCase()) || course.address.toLowerCase().includes(search.toLowerCase()))
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); setLoadingCourses(true); setLoadingReviews(true); await Promise.all([loadCourses(), loadReviews()]); setRefreshing(false) }} tintColor={c.accent} />

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>explore</Text></View>
      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="search courses" placeholderTextColor={c.inactive} value={search} onChangeText={setSearch} clearButtonMode="while-editing" autoCapitalize="none" autoCorrect={false} />
      </View>
      <View style={styles.tabRow}>
        <TabPill label="courses" active={activeTab === 'courses'} onPress={() => setActiveTab('courses')} styles={styles} />
        <TabPill label="reviews" active={activeTab === 'reviews'} onPress={() => setActiveTab('reviews')} styles={styles} />
        <TabPill label="map" active={activeTab === 'map'} onPress={() => setActiveTab('map')} styles={styles} />
      </View>

      {activeTab === 'courses' && detectedLocation && !loadingCourses && (
        <Text style={styles.debugLocation}>📍 {detectedLocation} · {unit}</Text>
      )}

      {activeTab === 'courses' && (
        loadingCourses ? <ActivityIndicator color={c.accent} style={styles.loader} />
        : locationError ? <View style={styles.errorState}><Text style={styles.errorText}>{locationError}</Text></View>
        : (
          <FlatList
            data={filteredCourses}
            keyExtractor={item => item.placeId}
            renderItem={({ item }) => <PlacesCourseCard course={item} unit={unit} isSaved={savedCourseIds.has(item.placeId)} onSave={handleToggleSave} styles={styles} onPress={() => navigation.navigate('CourseDetail', { placeId: item.placeId, name: item.name, address: item.address, lat: item.lat, lng: item.lng, distance: item.distance, unit, rating: item.rating, isSaved: savedCourseIds.has(item.placeId) })} />}
            contentContainerStyle={[styles.list, filteredCourses.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>no courses found nearby</Text></View>}
            refreshControl={refreshControl}
            onEndReached={loadMoreCourses}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? <ActivityIndicator color={c.accent} style={{ marginVertical: spacing.md }} />
              : !hasMore && nearbyCourses.length > 0 ? <Text style={styles.footerNote}>showing {nearbyCourses.length} courses within {loadedRadiusKm} {unit === 'km' ? 'km' : 'mi'}</Text>
              : null
            }
          />
        )
      )}

      {activeTab === 'reviews' && (
        loadingReviews ? <ActivityIndicator color={c.accent} style={styles.loader} />
        : (
          <FlatList
            data={reviews}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ReviewCard review={item} styles={styles} />}
            contentContainerStyle={[styles.list, reviews.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>no reviews yet</Text></View>}
            refreshControl={refreshControl}
          />
        )
      )}

      {activeTab === 'map' && (
        loadingCourses ? <ActivityIndicator color={c.accent} style={styles.loader} />
        : (
          <View style={{ flex: 1 }}>
            <CourseMap courses={nearbyCourses} userLatLng={userLatLng} savedIds={savedCourseIds} onRegionChange={handleMapRegionChange} loadingMap={loadingMap} unit={unit} styles={styles} />
            {mapTooFarOut && <View style={styles.mapOverlay}><Text style={styles.mapOverlayText}>zoom in to see courses</Text></View>}
          </View>
        )
      )}
    </SafeAreaView>
  )
}
