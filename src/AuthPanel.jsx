import React, { useEffect, useState } from 'react'
import { sendMagicLink, getUser, signOut, upsertProfile } from './api'

export default function AuthPanel(){
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [me, setMe] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(()=>{ getUser().then(setMe) },[])

  async function onSend(){
    try {
      await sendMagicLink(email)
      setMsg('Sprawdź maila – wysłałem magic link.')
    } catch(e){
      setMsg(e.message)
    }
  }

  async function onSaveNick(){
    try{
      await upsertProfile(nickname)
      setMsg('Zapisano nickname.')
    }catch(e){ setMsg(e.message) }
  }

  async function onLogout(){
    await signOut()
    setMe(null)
    setMsg('Wylogowano.')
  }

  if(!me){
    return (
      <div style={panelStyle}>
        <h3>Logowanie</h3>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <button onClick={onSend} style={btn}>Wyślij magic link</button>
        {msg && <p style={note}>{msg}</p>}
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <h3>Witaj!</h3>
      <p style={{margin:'4px 0'}}>Zalogowano: <code>{me.email}</code></p>
      <div style={{display:'flex', gap:8}}>
        <input placeholder="nickname" value={nickname} onChange={e=>setNickname(e.target.value)} style={inp}/>
        <button onClick={onSaveNick} style={btn}>Zapisz</button>
      </div>
      <button onClick={onLogout} style={{...btn, marginTop:8}}>Wyloguj</button>
      {msg && <p style={note}>{msg}</p>}
    </div>
  )
}

const panelStyle = { padding:12, border:'1px solid #ddd', borderRadius:8, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }
const inp = { padding:'8px 10px', border:'1px solid #ccc', borderRadius:6, flex:1 }
const btn = { padding:'8px 12px', border:'1px solid #222', borderRadius:6, background:'#222', color:'#fff', cursor:'pointer' }
const note = { fontSize:12, color:'#555' }
