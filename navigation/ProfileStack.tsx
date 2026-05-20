import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors } from '../lib/theme'

import ProfileScreen from '../screens/profile/ProfileScreen'
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen'
import StatisticsScreen from '../screens/profile/StatisticsScreen'
import ToursScreen from '../screens/profile/ToursScreen'
import PastRoundsScreen from '../screens/profile/PastRoundsScreen'
import BagScreen from '../screens/profile/BagScreen'

export type ProfileStackParamList = {
  ProfileMain: undefined
  ProfileSettings: undefined
  Statistics: undefined
  Tours: undefined
  PastRounds: undefined
  Bag: undefined
}

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="Tours" component={ToursScreen} />
      <Stack.Screen name="PastRounds" component={PastRoundsScreen} />
      <Stack.Screen name="Bag" component={BagScreen} />
    </Stack.Navigator>
  )
}
