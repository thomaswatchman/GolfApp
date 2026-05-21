import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { colors } from '../lib/theme'
import { DistanceUnit } from '../lib/placesApi'

import TabBar from '../components/TabBar'
import HomeScreen from '../screens/HomeScreen'
import ExploreScreen from '../screens/ExploreScreen'
import PlayScreen from '../screens/PlayScreen'
import NetworkScreen from '../screens/NetworkScreen'
import ProfileStack from './ProfileStack'
import UserProfileScreen from '../screens/UserProfileScreen'
import CourseDetailScreen from '../screens/CourseDetailScreen'
import HolePreviewScreen from '../screens/HolePreviewScreen'

export type RootStackParamList = {
  Tabs: undefined
  UserProfile: { userId: string }
  CourseDetail: {
    placeId: string
    name: string
    address: string
    lat: number
    lng: number
    distance: number
    unit: DistanceUnit
    rating: number | null
    isSaved: boolean
  }
  HolePreview: {
    placeId: string
    courseName: string
    tee: string
  }
}

const Root = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'home' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'explore' }} />
      <Tab.Screen name="Play" component={PlayScreen} options={{ title: 'play' }} />
      <Tab.Screen name="Network" component={NetworkScreen} options={{ title: 'network' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'profile' }} />
    </Tab.Navigator>
  )
}

export default function RootStack() {
  return (
    <Root.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Root.Screen name="Tabs" component={Tabs} />
      <Root.Screen name="UserProfile" component={UserProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Root.Screen name="CourseDetail" component={CourseDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Root.Screen name="HolePreview" component={HolePreviewScreen} options={{ animation: 'slide_from_right' }} />
    </Root.Navigator>
  )
}
