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
}

export interface UserLocation {
  lat: number
  lng: number
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

export async function getNearbyGolfCourses(userLocation: UserLocation): Promise<NearbyCoursesResult> {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is not set')

  const { lat, lng } = userLocation

  const [unit, firstPage] = await Promise.all([
    detectUnit(lat, lng),
    fetchPage(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=50000&keyword=golf+course&key=${API_KEY}`
    ),
  ])

  let results = [...(firstPage.results ?? [])]

  // Fetch up to 2 more pages (60 results total)
  if (firstPage.next_page_token) {
    await new Promise(r => setTimeout(r, 2000)) // API requires a short delay
    const page2 = await fetchPage(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?pagetoken=${firstPage.next_page_token}&key=${API_KEY}`
    ).catch(() => null)

    if (page2?.results) {
      results = [...results, ...page2.results]

      if (page2.next_page_token) {
        await new Promise(r => setTimeout(r, 2000))
        const page3 = await fetchPage(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?pagetoken=${page2.next_page_token}&key=${API_KEY}`
        ).catch(() => null)
        if (page3?.results) results = [...results, ...page3.results]
      }
    }
  }

  const seen = new Set<string>()
  const courses = results
    .filter((place: any) => {
      if (seen.has(place.place_id)) return false
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
    .sort((a: PlacesCourse, b: PlacesCourse) => a.distance - b.distance)

  return { courses, unit }
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
