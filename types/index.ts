export type GameMode = 'stroke' | 'match' | 'skins'
export type CourseCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor'
export type CourseType = 'public' | 'semi-private' | 'private'
export type RoundState = 'setup' | 'playing' | 'finished'

export interface User {
  id: string
  name: string
  avatarUrl: string | null
  handicap: number
  homeCourse: string | null
  followingCount: number
  followersCount: number
  roundsPlayed: number
  bestRound: number | null
}

export interface Club {
  name: string
  carryYardage: number
}

export interface Shot {
  id: string
  roundId: string
  hole: number
  lat: number
  lng: number
  club: string | null
  timestamp: string
}

export interface HoleScore {
  hole: number
  par: number
  strokes: number | null
  fairwayHit: boolean | null
  gir: boolean | null
}

export interface Round {
  id: string
  userId: string
  courseId: string
  courseName: string
  courseLocation: string
  date: string
  gameMode: GameMode
  scores: HoleScore[]
  grossScore: number | null
  vsPar: number | null
  girCount: number | null
  shots: Shot[]
}

export interface Course {
  id: string
  name: string
  location: string
  distanceAway: number
  holes: number
  type: CourseType
  starRating: number
  condition: CourseCondition
  lat: number
  lng: number
}

export interface ConditionReview {
  id: string
  userId: string
  userName: string
  courseId: string
  courseName: string
  condition: CourseCondition
  text: string
  createdAt: string
}

export interface FeedItem {
  id: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
    handicap: number
  }
  courseName: string
  courseLocation: string
  timeAgo: string
  grossScore: number
  vsPar: number
  girCount: number
  likes: number
  comments: number
  likedByMe: boolean
}

export interface Player {
  id: string
  name: string
  handicap: number
}
