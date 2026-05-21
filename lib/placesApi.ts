import * as Location from 'expo-location'

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? ''

export type DistanceUnit = 'km' | 'mi'

export interface PlacesCourse {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  distance: number
  rating: number | null
}

export interface NearbyCoursesResult {
  courses: PlacesCourse[]
  unit: DistanceUnit
  hasMore: boolean  // true if expanding radius would likely find more courses
}

export interface UserLocation {
  lat: number
  lng: number
}

export const INITIAL_RADIUS_KM = 15
export const EXPANDED_RADIUS_KM = 50
export const MAP_FETCH_RADIUS_KM = 20  // radius used for map pan fetches
export const MAP_MAX_LATITUDE_DELTA = 0.8  // ~90km visible — beyond this, don't fetch

/** Distance in km between two lat/lng points */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversine(lat1, lng1, lat2, lng2, 'km')
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  return status === 'granted'
}

export async function getCurrentLocation(): Promise<UserLocation | null> {
  const granted = await requestLocationPermission()
  if (!granted) return null
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return { lat: pos.coords.latitude, lng: pos.coords.longitude }
}

async function detectUnit(lat: number, lng: number): Promise<DistanceUnit> {
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
    return geo?.isoCountryCode === 'CA' ? 'km' : 'mi'
  } catch {
    return 'mi'
  }
}

async function fetchPage(url: string): Promise<any> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Places API error: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${json.status}`)
  }
  return json
}

const DISC_GOLF_TERMS = /disc\s*golf|frisbee\s*golf|disc\s*park/i

function mapResults(
  results: any[],
  lat: number,
  lng: number,
  unit: DistanceUnit,
  maxDistanceKm: number
): PlacesCourse[] {
  const seen = new Set<string>()
  return results
    .filter((place: any) => {
      if (seen.has(place.place_id)) return false
      if (DISC_GOLF_TERMS.test(place.name ?? '')) return false
      seen.add(place.place_id)
      return true
    })
    .map((place: any): PlacesCourse => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity ?? '',
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      distance: haversine(lat, lng, place.geometry.location.lat, place.geometry.location.lng, unit),
      rating: place.rating ?? null,
    }))
    .filter(c => haversine(lat, lng, c.lat, c.lng, 'km') <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance)
}

export async function getNearbyGolfCourses(
  userLocation: UserLocation,
  radiusKm: number = INITIAL_RADIUS_KM,
  existingPlaceIds: Set<string> = new Set()
): Promise<NearbyCoursesResult> {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is not set')

  const { lat, lng } = userLocation
  const radiusMeters = radiusKm * 1000

  const [unit, page] = await Promise.all([
    detectUnit(lat, lng),
    fetchPage(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${radiusMeters}&keyword=golf+course&key=${API_KEY}`
    ),
  ])

  const allResults = [...(page.results ?? [])]

  // Fetch second page if available (API requires ~2s delay)
  if (page.next_page_token) {
    await new Promise(r => setTimeout(r, 2000))
    const page2 = await fetchPage(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?pagetoken=${page.next_page_token}&key=${API_KEY}`
    ).catch(() => null)
    if (page2?.results) allResults.push(...page2.results)
  }

  const courses = mapResults(allResults, lat, lng, unit, radiusKm)
    .filter(c => !existingPlaceIds.has(c.placeId))

  return {
    courses,
    unit,
    hasMore: radiusKm < EXPANDED_RADIUS_KM,
  }
}

/** Single-page fetch — fast, used for map panning. No pagination delay. */
export async function fetchCoursesAt(
  location: UserLocation,
  unit: DistanceUnit,
  existingPlaceIds: Set<string>
): Promise<PlacesCourse[]> {
  if (!API_KEY) return []
  const { lat, lng } = location
  const page = await fetchPage(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${lat},${lng}&radius=${MAP_FETCH_RADIUS_KM * 1000}&keyword=golf+course&key=${API_KEY}`
  ).catch(() => null)
  if (!page?.results) return []
  return mapResults(page.results, lat, lng, unit, MAP_FETCH_RADIUS_KM)
    .filter(c => !existingPlaceIds.has(c.placeId))
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number, unit: DistanceUnit): number {
  const R = unit === 'km' ? 6371 : 3959
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
