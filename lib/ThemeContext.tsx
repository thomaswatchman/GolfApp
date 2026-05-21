import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeName, THEMES, ColorScheme, applyTheme } from './theme'
import { supabase } from './supabase'

const STORAGE_KEY = '@golf_theme'

interface ThemeContextValue {
  theme: ThemeName
  colors: ColorScheme
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: THEMES.dark,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark')

  // Load from AsyncStorage immediately (sync-ish), then verify from Supabase
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored && stored in THEMES) {
        applyTheme(stored as ThemeName)
        setThemeState(stored as ThemeName)
      }
    })

    // Then sync from Supabase (source of truth across devices)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('theme')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme && data.theme in THEMES) {
            const t = data.theme as ThemeName
            applyTheme(t)
            setThemeState(t)
            AsyncStorage.setItem(STORAGE_KEY, t)
          }
        })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        applyTheme('dark')
        setThemeState('dark')
        return
      }
      supabase
        .from('profiles')
        .select('theme')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme && data.theme in THEMES) {
            const t = data.theme as ThemeName
            applyTheme(t)
            setThemeState(t)
            AsyncStorage.setItem(STORAGE_KEY, t)
          }
        })
    })

    return () => subscription.unsubscribe()
  }, [])

  const setTheme = useCallback((newTheme: ThemeName) => {
    applyTheme(newTheme)
    setThemeState(newTheme)
    AsyncStorage.setItem(STORAGE_KEY, newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, colors: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
