import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { colors, spacing, radius, fontSize } from '../lib/theme'

interface Props {
  onNavigateToSignup: () => void
}

export default function LoginScreen({ onNavigateToSignup }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.top}>
          <View style={styles.logoMark} />
          <Text style={styles.appName}>golf</Text>
          <Text style={styles.tagline}>your game, your record</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={t => { setEmail(t); setError(null) }}
              placeholder="you@example.com"
              placeholderTextColor={colors.inactive}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={t => { setPassword(t); setError(null) }}
              placeholder="••••••••"
              placeholderTextColor={colors.inactive}
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryBtnText}>log in</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>don't have an account? </Text>
          <TouchableOpacity onPress={onNavigateToSignup} accessibilityRole="button">
            <Text style={styles.footerLink}>sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  top: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  appName: {
    color: colors.textBright,
    fontSize: 36,
    fontWeight: '500',
    letterSpacing: 1,
  },
  tagline: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  errorBox: {
    backgroundColor: '#2d1a1a',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textBright,
    fontSize: fontSize.md,
    minHeight: 52,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: spacing.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
})
