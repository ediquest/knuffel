import { supabase } from './supabaseClient'

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin }})
  if (error) throw error
  return true
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function upsertProfile(nickname) {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase.from('profiles').upsert({ id: user.id, nickname })
  if (error) throw error
}

export async function saveScore(game, points) {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase.from('scores').insert({ user_id: user.id, game, points })
  if (error) throw error
}

export async function getLeaderboard(game, limit=10) {
  const { data, error } = await supabase
    .from('scores')
    .select('user_id, points, created_at')
    .eq('game', game)
    .order('points', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  const ids = [...new Set(data.map(r=>r.user_id))]
  const { data: profs } = await supabase.from('profiles').select('id, nickname').in('id', ids)
  const map = Object.fromEntries((profs||[]).map(p=>[p.id, p.nickname||'Player']))
  return data.map(r=>({ ...r, nickname: map[r.user_id] || 'Player' }))
}
