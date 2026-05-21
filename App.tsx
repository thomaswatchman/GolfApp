import React, { useState, useEffect, useRef } from 'react'
import { StatusBar, Animated } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import RootStack from './navigation/RootStack'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import SplashScreen from './components/SplashScreen'

import { useAuth } from './hooks/useAuth'
import { ThemeProvider, useTheme } from './lib/ThemeContext'

const SPLASH_MIN_MS = 900

function AuthFlow() {
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  if (screen === 'signup') {
    return <SignupScreen onNavigateToLogin={() => setScreen('login')} />
  }
  return <LoginScreen onNavigateToSignup={() => setScreen('signup')} />
}

function AppContent() {
  const { session, loading } = useAuth()
  const { colors } = useTheme()

  const [splashDone, setSplashDone] = useState(false)
  const splashOpacity = useRef(new Animated.Value(1)).current
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (loading) return

    const elapsed = Date.now() - startTime.current
    const remaining = Math.max(0, SPLASH_MIN_MS - elapsed)

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setSplashDone(true))
    }, remaining)

    return () => clearTimeout(timer)
  }, [loading])

  const isLight = colors.bg === '#f4f7f0' || colors.bg === '#f2f2f7'

  return (
    <>
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={colors.bg}
      />

      {/* Main content — rendered underneath so it's ready when splash fades */}
      {splashDone && (
        session ? (
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        ) : (
          <AuthFlow />
        )
      )}

      {/* Splash sits on top and fades out */}
      {!splashDone && (
        <Animated.View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: splashOpacity }}
          pointerEvents="none"
        >
          <SplashScreen />
        </Animated.View>
      )}
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
