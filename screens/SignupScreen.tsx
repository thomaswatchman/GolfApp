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
  ScrollView,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { colors, spacing, radius, fontSize } from '../lib/theme'

interface Props {
  onNavigateToLogin: () => void
}

export default function SignupScreen({ onNavigateToLogin }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignup() {
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>check your email</Text>
          <Text style={styles.successBody}>
            We sent a confirmation link to{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onNavigateToLogin}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>back to log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.top}>
            <View style={styles.logoMark} />
            <Text style={styles.appName}>golf</Text>
            <Text style={styles.tagline}>create your account</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={t => { setName(t); setError(null) }}
                placeholder="your name"
                placeholderTextColor={colors.inactive}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                returnKeyType="next"
              />
            </View>

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
                placeholder="min. 6 characters"
                placeholderTextColor={colors.inactive}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); setError(null) }}
                placeholder="••••••••"
                placeholderTextColor={colors.inactive}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} accessibilityRole="button">
              <Text style={styles.footerLink}>log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
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
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successIconText: {
    color: colors.bg,
    fontSize: 28,
    fontWeight: '500',
  },
  successTitle: {
    color: colors.textBright,
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  successBody: {
    color: colors.muted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: colors.textLight,
    fontWeight: '500',
  },
  secondaryBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.textLight,
    fontSize: fontSize.md,
  },
})
