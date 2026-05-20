# Golf App — Product Brief

## Overview

A premium golf companion app targeting serious amateur golfers. The core inspiration is Strava's social model applied to golf — clean, social-first, activity-driven — combined with best-in-class GPS accuracy and deep round analytics. The app must be simple enough for older golfers while powerful enough for low handicappers.

The working name is TBD. Candidates include: Palo, Volta, Hoyo, Flush, Scratch, Nassau. Final name to be decided.

---

## Vision

"What's your \_\_\_?" — the app becomes a golfer's identity and record. Every round logged, every stat tracked, every course reviewed. A social layer that makes golf more connected without being gimmicky.

---

## Target Users

- Primary: serious amateur golfers, handicap 0–20, ages 25–55
- Secondary: older recreational golfers (accessibility is a hard requirement)
- Geography: North America launch, international later

---

## Design System

### Colours

- Background: deep dark green (`#0f1a12`)
- Surface: `#162218`
- Border/divider: `#1e2e1e` / `#2a3d2c`
- Primary accent: `#5db85d` (bright green)
- Muted text: `#7aab7a`
- Inactive elements: `#4a6b4a`
- Light text: `#c8e6c8`, `#e8f5e8`
- Danger/bogey: `#e87a7a`
- Birdie: `#5db85d`

### Typography

- Font: System default (SF Pro on iOS)
- Weights: 400 regular, 500 medium only — never heavy weights
- Sentence case everywhere — no ALL CAPS, no Title Case in UI labels

### Design Principles

- Simple and uncluttered — older golfer accessibility is a hard requirement
- Minimal taps to get distances during a round
- Dark OLED-friendly for outdoor use and battery saving
- Flat design — no gradients, no heavy shadows
- Map-first during a round, data overlaid on top

---

## Tech Stack

### Mobile

- **React Native + Expo** (TypeScript)
- iOS first, Android later
- Apple Watch via WatchConnectivity bridge

### Backend

- **Supabase** — auth, PostgreSQL database, real-time feed, file storage

### Key Libraries

- `expo-location` — GPS
- `expo-sqlite` — offline storage
- `expo-file-system` — offline course map storage
- `@supabase/supabase-js` — backend client
- `@react-navigation/native` + `@react-navigation/bottom-tabs` — navigation

### Scaffold Command

```bash
npx create-expo-app@latest golfapp --template blank-typescript
cd golfapp
npx expo install expo-location expo-sqlite expo-file-system
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

---

## Folder Structure

```
/src
  /screens
    HomeScreen.tsx
    ExploreScreen.tsx
    PlayScreen.tsx
    NetworkScreen.tsx
    ProfileScreen.tsx
  /components
  /hooks
  /lib
    supabase.ts
  /types
```

---

## Navigation Structure

Five bottom tabs. Play is centred and elevated above the tab bar like Strava's record button.

```
Home  |  Explore  |  [⛳ Play]  |  Network  |  Profile
```

---

## Screens

### 1. Home / Feed

Strava-inspired activity feed of completed rounds posted by people the user follows.

**Feed card contains:**

- User avatar + name + time ago
- Course name + location
- Post content — user chooses at post time from:
    - Shot map (hole-by-hole trace)
    - Scorecard grid
    - Final score summary
    - Photos (carousel)
    - Any combination of the above
- Key stats: gross score, vs par, GIR
- Social actions: like, comment, share

**Notes:**

- Completed rounds only for now — no live during-round updates (revisit in V2)
- Feed is chronological from people you follow

---

### 2. Explore

Courses-only screen. People discovery is handled in Network tab.

**Tabs within Explore:**

- Courses — list of nearby courses sorted by distance
- Reviews — recent condition reviews from the community
- Map — map view of courses in the area

**Course card contains:**

- Course name
- Distance away
- Holes + type (public / semi-private / private)
- Star rating
- Current condition rating (Excellent / Good / Fair / Poor) — AllTrails-style crowdsourced

**Course condition reviews:**

- Users can leave a condition review after a round
- Short text + condition rating
- Visible on course page and in Reviews tab

---

### 3. Play (centred, primary tab)

The core in-round experience. Equal priority between Apple Watch and iPhone — user decides which they use.

#### Pre-round setup

- Select course (from downloaded maps or search)
- Select game mode: Stroke Play, Match Play, Skins
- Select players / scoring partners

#### During round — GPS screen (map-first)

**Primary view:** Aerial hole map fills the screen

- Hole outline, fairway, green, tee box visible
- Hazards visible: bunkers, water, OB lines
- Player position dot updates live as they walk
- Dashed yardage rings: front / center / back of green
- Flag position marker on green

**Overlays on the map:**

- Top left: hole number + par
- Top right: distance overlay card showing:
    - Large center distance (primary)
    - Front and back distances below
- Bottom: current score vs par

**Shot logging:**

- Tap "Log shot" button to record shot from current GPS position
- Shot markers appear on the map as the round progresses
- Editable — tap any previous shot to correct club or position

**Scorecard strip:**

- Horizontal scrolling strip below the map showing holes played
- Colour coded: birdie (green), par (neutral), bogey+ (red)
- Tappable — tap any previous hole to go back and edit the score

#### Apple Watch integration

- Distances to front/center/back on watch face
- Tap to log shot from watch
- Score entry on watch
- Haptic feedback on hole completion
- Glanceable current score vs par

#### Offline support

- Course maps downloadable before a round
- Full GPS functionality works offline
- Round data syncs when connection restored

---

### 4. Network

People discovery and social connections. Separate from Explore (which is courses only).

**Sections:**

- Search bar — find players by name
- Following — list of people you follow with last active round
- Suggested — based on location, mutual connections, courses played

**Player row contains:**

- Avatar + name
- Handicap
- Home course or last course played
- Mutual connections count (for suggested)
- Follow / Following button

---

### 5. Profile

**Header:**

- Avatar
- Name
- Current handicap index

**Stats bar:**

- Rounds played
- Best round
- Following count
- Followers count

**My Bag:**

- Full club list with user-set carry yardages
- Every club in the bag, user customises
- Yardages updatable at any time
- Used to power club recommendations during rounds (V2)

**Past rounds:**

- Scrollable list of logged rounds (V2 detail view)

---

## Game Modes

All three available at launch:

### Stroke Play

- Standard gross score tracking
- Net score calculated from handicap

### Match Play

- Hole-by-hole win/loss/halve tracking
- Running match status displayed (e.g. "2UP through 9")
- Supports handicap strokes

### Skins

- Per-hole skin tracking
- Carryover skins on halved holes
- Pot summary at end of round
- Supports multiple players

---

## Post-Round Flow

After the round ends, user is prompted to share.

**Share options (user selects at post time):**

- Shot map — traced path of the round hole by hole
- Scorecard — full hole-by-hole grid
- Final score — clean summary card
- Photos — carousel of photos taken during the round
- Combinations of the above

**Also at post-round:**

- Course condition review prompt (optional)
- Strava export option (post round as a workout activity)

---

## Integrations

### Strava

- Export completed round as a workout/activity
- OAuth connection in profile settings
- Round duration + distance posted to Strava

### Apple Watch

- Full WatchConnectivity integration
- See Apple Watch section under Play screen

### Handicap

- WHS (World Handicap System) compliant calculation
- Handicap index displayed on profile
- Updates automatically after each posted round

---

## Accessibility Requirements

- Large tap targets throughout — nothing smaller than 44pt
- High contrast text on all dark surfaces
- Simple uncluttered screens — one primary action per screen where possible
- Voice readout of distances considered for V2
- No complex gestures required for core functionality

---

## V2 Features (deferred)

These are confirmed ideas not being built at launch:

- Live during-round social updates
- AI caddie / club recommendations based on bag yardages + shot history
- Web dashboard for deep round analysis (paired with mobile app)
- Voice readout of distances
- Shot pattern analysis (where are misses going?)
- Detailed hole-by-hole stats (strokes gained, proximity to hole)
- Driving range session tracking
- Tournament / competition mode
- Handicap posting to official systems
- Android app

---

## Open Decisions

These need to be resolved before or during build:

- [ ] App name — shortlist: Palo, Volta, Hoyo, Flush, Scratch, Nassau
- [ ] Course map data source — need to evaluate Golf Course API providers (e.g. Golfbert, Golf API, OpenStreetMap golf data)
- [ ] Exact post card design — content and layout TBD
- [ ] Handicap system — build own WHS calculator or integrate third-party
- [ ] Monetisation model — subscription vs freemium vs one-time purchase
- [ ] GPS accuracy strategy — phone GPS only, or support Bluetooth timing/sensor accessories

---

## Competitive Context

| App       | Weakness this app addresses                           |
| --------- | ----------------------------------------------------- |
| 18Birdies | Bloated UI, weak social, mediocre GPS, abandoned feel |
| Golfshot  | Dated design, poor social                             |
| Arccos    | Hardware dependent, expensive                         |
| TheGrint  | Handicap focused, weak GPS and social                 |
| Hole19    | Closer competitor — watch social layer and UX closely |

The primary differentiator is the combination of: Strava-quality social layer + map-first GPS experience + Apple Watch depth + clean design accessible to all ages.
