import React, { useState } from 'react'
import { StatusBar, View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import TabBar from './components/TabBar'
import HomeScreen from './screens/HomeScreen'
import ExploreScreen from './screens/ExploreScreen'
import PlayScreen from './screens/PlayScreen'
import NetworkScreen from './screens/NetworkScreen'
import ProfileStack from './navigation/ProfileStack'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'

import { useAuth } from './hooks/useAuth'
import { colors } from './lib/theme'

export type RootTabParamList = {
  Home: undefined
  Explore: undefined
  Play: undefined
  Network: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<RootTabParamList>()

function MainApp() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  )
}

function AuthFlow() {
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  if (screen === 'signup') {
    return <SignupScreen onNavigateToLogin={() => setScreen('login')} />
  }
  return <LoginScreen onNavigateToSignup={() => setScreen('signup')} />
}

export default function App() {
  const { session, loading } = useAuth()

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : session ? (
        <MainApp />
      ) : (
        <AuthFlow />
      )}
    </SafeAreaProvider>
  )
}
