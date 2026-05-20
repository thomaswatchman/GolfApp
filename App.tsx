import React, { useState } from 'react'
import { StatusBar, View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import RootStack from './navigation/RootStack'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'

import { useAuth } from './hooks/useAuth'
import { colors } from './lib/theme'

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
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      ) : (
        <AuthFlow />
      )}
    </SafeAreaProvider>
  )
}
