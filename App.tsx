import React from 'react'
import { StatusBar } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import TabBar from './components/TabBar'
import HomeScreen from './screens/HomeScreen'
import ExploreScreen from './screens/ExploreScreen'
import PlayScreen from './screens/PlayScreen'
import NetworkScreen from './screens/NetworkScreen'
import ProfileScreen from './screens/ProfileScreen'

import { colors } from './lib/theme'

export type RootTabParamList = {
  Home: undefined
  Explore: undefined
  Play: undefined
  Network: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<RootTabParamList>()

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <NavigationContainer>
        <Tab.Navigator
          tabBar={props => <TabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'home' }} />
          <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'explore' }} />
          <Tab.Screen name="Play" component={PlayScreen} options={{ title: 'play' }} />
          <Tab.Screen name="Network" component={NetworkScreen} options={{ title: 'network' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'profile' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
