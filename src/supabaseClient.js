import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPA_URL
const supabaseAnon = import.meta.env.VITE_SUPA_ANON

export const supabase = createClient(supabaseUrl, supabaseAnon)

import { supabase } from './supabaseClient'

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  })
  if (error) throw error
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
}
export async function upsertProfile(nickname) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase.from('profiles').upsert({ id: user.id, nickname })
  if (error) throw error
}
export async function saveScore(game, points) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase.from('scores').insert({ user_id: user.id, game, points })
  if (error) throw error
}

export async function getLeaderboard(game, limit = 10) {
  const { data: rows, error } = await supabase
    .from('scores')
    .select('user_id, points, created_at')
    .eq('game', game)
    .order('points', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error

  const ids = [...new Set(rows.map(r => r.user_id))]
  const { data: profs } = await supabase.from('profiles')
    .select('id, nickname').in('id', ids)

  const map = Object.fromEntries((profs||[]).map(p => [p.id, p.nickname || 'Player']))
  return rows.map(r => ({ ...r, nickname: map[r.user_id] || 'Player' }))
}
