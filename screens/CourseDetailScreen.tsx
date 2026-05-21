import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker } from 'react-native-maps'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius, fontSize } from '../lib/theme'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation/RootStack'

type Nav = NativeStackNavigationProp<RootStackParamList>
type RouteProps = RouteProp<RootStackParamList, 'CourseDetail'>

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? ''

type Tee = 'black' | 'blue' | 'white' | 'gold' | 'red'

const TEE_COLORS: Record<Tee, string> = {
  black: '#1a1a1a',
  blue: '#3a7bd5',
  white: '#e8f5e8',
  gold: '#f0c040',
  red: '#e87a7a',
}

const TEE_LABELS: Record<Tee, string> = {
  black: 'Black',
  blue: 'Blue',
  white: 'White',
  gold: 'Gold',
  red: 'Red',
}

interface PlaceDetails {
  phone: string | null
  website: string | null
  openNow: boolean | null
  hoursText: string[]
  photoUrl: string | null
}

export default function CourseDetailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProps>()
  const { placeId, name, address, lat, lng, distance, unit, rating, isSaved: initialSaved } = route.params

  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [savingInProgress, setSavingInProgress] = useState(false)
  const [selectedTee, setSelectedTee] = useState<Tee>('black')

  useEffect(() => {
    if (!API_KEY) { setLoadingDetails(false); return }

    fetch(
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=formatted_phone_number,website,opening_hours,photos,rating` +
      `&key=${API_KEY}`
    )
      .then(r => r.json())
      .then(json => {
        const d = json.result ?? {}
        const photo = d.photos?.[0]?.photo_reference
        setDetails({
          phone: d.formatted_phone_number ?? null,
          website: d.website ?? null,
          openNow: d.opening_hours?.open_now ?? null,
          hoursText: d.opening_hours?.weekday_text ?? [],
          photoUrl: photo
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo}&key=${API_KEY}`
            : null,
        })
      })
      .catch(() => setDetails(null))
      .finally(() => setLoadingDetails(false))
  }, [placeId])

  async function handleToggleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || savingInProgress) return
    setSavingInProgress(true)

    if (isSaved) {
      await supabase.from('saved_courses').delete()
        .eq('user_id', user.id).eq('places_id', placeId)
      setIsSaved(false)
    } else {
      const { data: courseRow } = await supabase
        .from('courses')
        .upsert(
          { places_id: placeId, name, location: address, lat, lng },
          { onConflict: 'places_id', ignoreDuplicates: false }
        )
        .select('id').single()
      if (courseRow) {
        await supabase.from('saved_courses').upsert({
          user_id: user.id, course_id: courseRow.id,
          places_id: placeId, course_name: name, course_location: address,
        })
        setIsSaved(true)
      }
    }
    setSavingInProgress(false)
  }

  const tees: Tee[] = ['black', 'blue', 'white', 'gold', 'red']

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
          onPress={handleToggleSave}
          disabled={savingInProgress}
        >
          <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextActive]}>
            {isSaved ? '✓ saved' : 'save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero image or map */}
        {details?.photoUrl ? (
          <Image source={{ uri: details.photoUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <MapView
            style={styles.heroMap}
            initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
            scrollEnabled={false}
            zoomEnabled={false}
            userInterfaceStyle="dark"
          >
            <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor={colors.accent} />
          </MapView>
        )}

        {/* Course name + info */}
        <View style={styles.infoSection}>
          <Text style={styles.courseName}>{name}</Text>
          <Text style={styles.courseAddress}>{address}</Text>
          <View style={styles.metaRow}>
            {rating != null && (
              <Text style={styles.rating}>★ {rating.toFixed(1)}</Text>
            )}
            <Text style={styles.distance}>{distance.toFixed(1)} {unit} away</Text>
            {details?.openNow != null && (
              <Text style={[styles.openStatus, { color: details.openNow ? colors.accent : colors.danger }]}>
                {details.openNow ? 'open now' : 'closed'}
              </Text>
            )}
          </View>
        </View>

        {/* Tee selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>tee selection</Text>
          <View style={styles.teeRow}>
            {tees.map(tee => (
              <TouchableOpacity
                key={tee}
                style={[
                  styles.teeBtn,
                  { borderColor: TEE_COLORS[tee] },
                  selectedTee === tee && { backgroundColor: TEE_COLORS[tee] },
                ]}
                onPress={() => setSelectedTee(tee)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.teeBtnText,
                  selectedTee === tee && tee !== 'white' && tee !== 'gold' && { color: colors.textBright },
                  selectedTee === tee && (tee === 'white' || tee === 'gold') && { color: colors.bg },
                ]}>
                  {TEE_LABELS[tee]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.teeNote}>
            yardages require a course data integration — see hole preview for layout
          </Text>
        </View>

        {/* Full map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>course location</Text>
          <MapView
            style={styles.fullMap}
            initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
            userInterfaceStyle="dark"
          >
            <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor={colors.accent} />
          </MapView>
        </View>

        {/* Contact info */}
        {(details?.phone || details?.website) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>contact</Text>
            <View style={styles.card}>
              {details.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`tel:${details.phone}`)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.contactLabel}>phone</Text>
                  <Text style={styles.contactValue}>{details.phone}</Text>
                </TouchableOpacity>
              )}
              {details.website && (
                <TouchableOpacity
                  style={[styles.contactRow, details.phone && styles.contactRowBorder]}
                  onPress={() => Linking.openURL(details.website!)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.contactLabel}>website</Text>
                  <Text style={[styles.contactValue, { color: colors.accent }]} numberOfLines={1}>
                    {details.website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Hours */}
        {(details?.hoursText?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>hours</Text>
            <View style={styles.card}>
              {details!.hoursText.map((line, i) => (
                <Text key={i} style={[styles.hoursLine, i > 0 && styles.hoursLineBorder]}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        )}

        {loadingDetails && (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
        )}

        {/* Hole preview CTA */}
        <TouchableOpacity
          style={styles.holePreviewBtn}
          onPress={() => navigation.navigate('HolePreview', { placeId, courseName: name, tee: selectedTee })}
          activeOpacity={0.85}
        >
          <Text style={styles.holePreviewBtnText}>hole by hole preview →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.accent, fontSize: fontSize.md },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 36,
    justifyContent: 'center',
  },
  saveBtnActive: { backgroundColor: colors.accent },
  saveBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  saveBtnTextActive: { color: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  heroImage: { width: '100%', height: 220 },
  heroMap: { width: '100%', height: 220 },
  infoSection: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  courseName: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500', marginBottom: spacing.xs },
  courseAddress: { color: colors.muted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  rating: { color: colors.gold, fontSize: fontSize.sm, fontWeight: '500' },
  distance: { color: colors.muted, fontSize: fontSize.sm },
  openStatus: { fontSize: fontSize.sm, fontWeight: '500' },
  section: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.md },
  teeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm },
  teeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 2,
    minHeight: 36,
    justifyContent: 'center',
  },
  teeBtnText: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '500' },
  teeNote: { color: colors.inactive, fontSize: fontSize.xs, lineHeight: 18 },
  fullMap: { width: '100%', height: 220, borderRadius: radius.md, overflow: 'hidden' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 52,
  },
  contactRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  contactLabel: { color: colors.muted, fontSize: fontSize.sm },
  contactValue: { color: colors.textLight, fontSize: fontSize.sm, flex: 1, textAlign: 'right', marginLeft: spacing.md },
  hoursLine: { color: colors.textLight, fontSize: fontSize.sm, padding: spacing.sm, paddingHorizontal: spacing.md },
  hoursLineBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  holePreviewBtn: {
    margin: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  holePreviewBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '500' },
})
