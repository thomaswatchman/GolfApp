export type ThemeName = 'dark' | 'light' | 'masters'

export type ColorScheme = {
  bg: string
  surface: string
  border: string
  borderLight: string
  accent: string
  muted: string
  inactive: string
  textLight: string
  textBright: string
  danger: string
  birdie: string
  gold: string
}

const dark: ColorScheme = {
  bg: '#111111',
  surface: '#1c1c1e',
  border: '#2c2c2e',
  borderLight: '#3a3a3c',
  accent: '#5db85d',
  muted: '#8e8e93',
  inactive: '#48484a',
  textLight: '#d1d1d6',
  textBright: '#f2f2f7',
  danger: '#e87a7a',
  birdie: '#5db85d',
  gold: '#f0c040',
}

const light: ColorScheme = {
  bg: '#f2f2f7',
  surface: '#ffffff',
  border: '#e0e0e0',
  borderLight: '#c8c8cc',
  accent: '#4aa84a',
  muted: '#6b6b70',
  inactive: '#a8a8ae',
  textLight: '#3a3a3c',
  textBright: '#1c1c1e',
  danger: '#d94f4f',
  birdie: '#4aa84a',
  gold: '#c8a000',
}

const masters: ColorScheme = {
  bg: '#0b1a0d',
  surface: '#122214',
  border: '#1c3320',
  borderLight: '#27472b',
  accent: '#c9a84c',       // Masters gold
  muted: '#7a9e6a',
  inactive: '#3d6040',
  textLight: '#cce0b8',
  textBright: '#f0f5e8',   // cream white
  danger: '#c94040',       // pin red
  birdie: '#5db85d',
  gold: '#c9a84c',
}

export const THEMES: Record<ThemeName, ColorScheme> = { dark, light, masters }

export const THEME_LABELS: Record<ThemeName, string> = {
  dark: 'dark',
  light: 'light',
  masters: 'masters',
}

// Mutable singleton — screens that import colors directly get live updates
// when applyTheme() is called and the component re-renders
export const colors: ColorScheme = { ...dark }

export function applyTheme(theme: ThemeName) {
  Object.assign(colors, THEMES[theme])
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
} as const

export const TAB_BAR_HEIGHT = 90
