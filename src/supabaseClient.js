import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPA_URL
const supabaseAnon = import.meta.env.VITE_SUPA_ANON

if (!supabaseUrl)  throw new Error('VITE_SUPA_URL is missing')
if (!supabaseAnon) throw new Error('VITE_SUPA_ANON is missing')

// Single instance (także podczas HMR)
let client
if (typeof window !== 'undefined') {
  client = window.__supabase ?? createClient(supabaseUrl, supabaseAnon)
  window.__supabase = client
} else {
  client = createClient(supabaseUrl, supabaseAnon)
}

export const supabase = client
export default supabase
