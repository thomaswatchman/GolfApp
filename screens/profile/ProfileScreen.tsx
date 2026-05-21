import React, { useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { spacing, radius, fontSize, TAB_BAR_HEIGHT, ColorScheme } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { ProfileStackParamList } from '../../navigation/ProfileStack'
import { useTheme } from '../../lib/ThemeContext'
import { cacheGet, cacheSet, cacheInvalidate } from '../../lib/dataCache'

const CACHE_KEY = 'profile_self'

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

import { StatOption, STAT_LABELS } from './ProfileSettingsScreen'

interface Profile {
  id: string
  fullName: string
  bio: string | null
  handicap: number | null
  avatarUrl: string | null
  roundsPlayed: number
  bestRound: number | null
  followingCount: number
  followersCount: number
  statSlot1: StatOption
  statSlot2: StatOption
  statSlot3: StatOption
  statSlot4: StatOption
}

function GolferSilhouette() {
  const { colors: c } = useTheme()
  return (
    <View style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.borderLight }}>
      <Text style={{ fontSize: 48 }}>🏌️</Text>
    </View>
  )
}

function SectionRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors: c } = useTheme()
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 56, borderBottomWidth: 1, borderBottomColor: c.border }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={{ color: c.textBright, fontSize: fontSize.md, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: c.muted, fontSize: 22, fontWeight: '300' }}>›</Text>
    </TouchableOpacity>
  )
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: c.textBright, fontSize: fontSize.lg, fontWeight: '500' }}>{value}</Text>
      <Text style={{ color: c.muted, fontSize: fontSize.xs, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function getStatValue(profile: Profile, stat: StatOption): string | number {
  switch (stat) {
    case 'rounds': return profile.roundsPlayed
    case 'best_round': return profile.bestRound ?? '—'
    case 'following': return profile.followingCount
    case 'followers': return profile.followersCount
    case 'avg_score': return '—'
    case 'gir_pct': return '—'
    case 'fairways_pct': return '—'
    case 'rounds_year': return '—'
    case 'avg_driver': return '—'
    case 'handicap': return profile.handicap != null ? profile.handicap.toFixed(1) : '—'
    case 'blank': return ''
  }
}

function StatLabel(stat: StatOption): string {
  return STAT_LABELS[stat] === '—  blank' ? '' : STAT_LABELS[stat]
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { colors: c } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState('')

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      const p: Profile = {
        id: data.id,
        fullName: data.full_name ?? user.email ?? 'Golfer',
        bio: data.bio ?? null,
        handicap: data.handicap ?? null,
        avatarUrl: data.avatar_url ?? null,
        roundsPlayed: data.rounds_played ?? 0,
        bestRound: data.best_round ?? null,
        followingCount: data.following_count ?? 0,
        followersCount: data.followers_count ?? 0,
        statSlot1: (data.stat_slot_1 as StatOption) || 'rounds',
        statSlot2: (data.stat_slot_2 as StatOption) || 'best_round',
        statSlot3: (data.stat_slot_3 as StatOption) || 'following',
        statSlot4: (data.stat_slot_4 as StatOption) || 'followers',
      }
      cacheSet(CACHE_KEY, p)
      setProfile(p)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    const cached = cacheGet<Profile>(CACHE_KEY)
    if (cached) {
      setProfile(cached)
      setLoading(false)
      loadProfile() // refresh silently in background
    } else {
      loadProfile().finally(() => setLoading(false))
    }
  }, [loadProfile]))

  async function handleRefresh() {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }

  async function handleEditBio() {
    setBioDraft(profile?.bio ?? '')
    setEditingBio(true)
  }

  async function handleSaveBio() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const trimmed = bioDraft.trim()
    await supabase.from('profiles').update({ bio: trimmed || null }).eq('id', user.id)
    setProfile(prev => prev ? { ...prev, bio: trimmed || null } : prev)
    cacheInvalidate(CACHE_KEY)
    setEditingBio(false)
  }

  async function handlePickPhoto() {
    Alert.alert('profile photo', 'choose a source', [
      {
        text: 'camera',
        onPress: () => pickImage('camera'),
      },
      {
        text: 'photo library',
        onPress: () => pickImage('library'),
      },
      { text: 'cancel', style: 'cancel' },
    ])
  }

  async function pickImage(source: 'camera' | 'library') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let result
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('permission needed', 'camera access is required to take a photo')
        return
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('permission needed', 'photo library access is required')
        return
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
    }

    if (result.canceled || !result.assets[0]) return

    setUploadingPhoto(true)
    try {
      const asset = result.assets[0]
      // Strip query params before extracting extension
      const cleanUri = asset.uri.split('?')[0]
      const ext = cleanUri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
      const path = `${user.id}.${ext}`

      // Read as base64 via expo-file-system — most reliable on React Native
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64' as any,
      })
      const bytes = decodeBase64(base64)

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { upsert: true, contentType: mimeType })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      setProfile(prev => prev ? { ...prev, avatarUrl: publicUrl } : prev)
      cacheInvalidate(CACHE_KEY)
    } catch (err: any) {
      console.error('Upload error:', err?.message ?? err)
      Alert.alert('upload failed', 'could not save your photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={c.accent} style={{ marginTop: spacing.xxl }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Settings icon */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate('ProfileSettings')}
        accessibilityRole="button"
        accessibilityLabel="Profile settings"
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />
        }
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={styles.avatarWrapper}>
            {uploadingPhoto ? (
              <View style={styles.avatarContainer}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <GolferSilhouette />
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>edit</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>

          {/* Bio */}
          {editingBio ? (
            <View style={styles.bioEditWrapper}>
              <TextInput
                style={styles.bioInput}
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder="write a short bio…"
                placeholderTextColor={c.inactive}
                multiline
                maxLength={160}
                autoFocus
              />
              <View style={styles.bioActions}>
                <TouchableOpacity onPress={() => setEditingBio(false)} style={styles.bioCancelBtn}>
                  <Text style={styles.bioCancelText}>cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveBio} style={styles.bioSaveBtn}>
                  <Text style={styles.bioSaveText}>save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditBio} activeOpacity={0.75} style={styles.bioRow}>
              <Text style={profile?.bio ? styles.bioText : styles.bioPlaceholder}>
                {profile?.bio ?? 'add a bio'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats bar — filters out blank slots, remaining fill evenly */}
        {profile && (() => {
          const slots = [
            profile.statSlot1, profile.statSlot2, profile.statSlot3, profile.statSlot4,
          ].filter(s => s !== 'blank')
          return (
            <View style={styles.statsBar}>
              {slots.map((slot, i) => (
                <React.Fragment key={slot + i}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <StatBlock value={getStatValue(profile, slot)} label={StatLabel(slot)} />
                </React.Fragment>
              ))}
            </View>
          )
        })()}

        {/* Navigation sections */}
        <View style={styles.sections}>
          <SectionRow label="my bag" onPress={() => navigation.navigate('Bag')} />
          <SectionRow label="statistics" onPress={() => navigation.navigate('Statistics')} />
          <SectionRow label="tours" onPress={() => navigation.navigate('Tours')} />
          <SectionRow label="past rounds" onPress={() => navigation.navigate('PastRounds')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    settingsBtn: {
      position: 'absolute', top: 52, right: spacing.md, zIndex: 10,
      padding: spacing.sm, minHeight: 44, minWidth: 44,
      alignItems: 'center', justifyContent: 'center',
    },
    settingsIcon: { color: c.muted, fontSize: 22 },
    scrollContent: { paddingBottom: TAB_BAR_HEIGHT + spacing.md },
    avatarSection: {
      alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    avatarWrapper: { marginBottom: spacing.md, position: 'relative' },
    avatarContainer: {
      width: 96, height: 96, borderRadius: radius.full,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: c.borderLight,
    },
    avatarImage: { width: 96, height: 96, borderRadius: radius.full, borderWidth: 2, borderColor: c.borderLight },
    silhouette: {
      width: 96, height: 96, borderRadius: radius.full,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: c.borderLight,
    },
    silhouetteEmoji: { fontSize: 48 },
    editBadge: {
      position: 'absolute', bottom: 0, right: 0,
      backgroundColor: c.accent, borderRadius: radius.full,
      paddingHorizontal: spacing.sm, paddingVertical: 2,
      borderWidth: 2, borderColor: c.bg,
    },
    editBadgeText: { color: c.bg, fontSize: fontSize.xs, fontWeight: '500' },
    name: { color: c.textBright, fontSize: fontSize.xl, fontWeight: '500', marginBottom: spacing.xs },
    bioRow: { paddingHorizontal: spacing.xl, marginTop: spacing.xs },
    bioText: { color: c.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
    bioPlaceholder: { color: c.inactive, fontSize: fontSize.sm, textAlign: 'center' },
    bioEditWrapper: { width: '100%', paddingHorizontal: spacing.lg, marginTop: spacing.sm, gap: spacing.sm },
    bioInput: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      color: c.textBright, fontSize: fontSize.sm, minHeight: 72, textAlignVertical: 'top',
    },
    bioActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
    bioCancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 36, justifyContent: 'center' },
    bioCancelText: { color: c.muted, fontSize: fontSize.sm },
    bioSaveBtn: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      backgroundColor: c.accent, borderRadius: radius.full, minHeight: 36, justifyContent: 'center',
    },
    bioSaveText: { color: c.bg, fontSize: fontSize.sm, fontWeight: '500' },
    statsBar: { flexDirection: 'row', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
    statBlock: { flex: 1, alignItems: 'center' },
    statValue: { color: c.textBright, fontSize: fontSize.lg, fontWeight: '500' },
    statLabel: { color: c.muted, fontSize: fontSize.xs, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: c.border, marginVertical: spacing.xs },
    sections: { borderBottomWidth: 1, borderBottomColor: c.border },
    sectionRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      minHeight: 56, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    sectionRowLabel: { color: c.textBright, fontSize: fontSize.md, fontWeight: '500' },
    sectionRowChevron: { color: c.muted, fontSize: 22, fontWeight: '300' },
  })
}
