import React, { useEffect, useState } from 'react'
import { getLeaderboard, saveScore } from './api'

export default function Leaderboard({ game='knuffel' }){
  const [top, setTop] = useState([])
  const [score, setScore] = useState('')
  const [msg, setMsg] = useState('')

  async function refresh(){
    try{
      const data = await getLeaderboard(game, 10)
      setTop(data)
    }catch(e){ setMsg(e.message) }
  }

  useEffect(()=>{ refresh() },[])

  async function onSave(){
    try{
      const points = parseInt(score,10) || 0
      await saveScore(game, points)
      setMsg('Wynik zapisany.')
      setScore('')
      refresh()
    }catch(e){ setMsg(e.message) }
  }

  return (
    <div style={panelStyle}>
      <h3>Top 10 – {game}</h3>
      <ol style={{paddingLeft:16}}>
        {top.map((r,i)=>(
          <li key={i} style={{display:'flex', justifyContent:'space-between', gap:12}}>
            <span>{r.nickname||'Player'}</span>
            <b>{r.points}</b>
          </li>
        ))}
        {top.length===0 && <p>Brak wyników.</p>}
      </ol>

      <div style={{display:'flex', gap:8}}>
        <input placeholder="Twój wynik" value={score} onChange={e=>setScore(e.target.value)} style={inp}/>
        <button onClick={onSave} style={btn}>Zapisz</button>
      </div>
      {msg && <p style={note}>{msg}</p>}
      <p style={{fontSize:11, color:'#777', marginTop:8}}>
        ⚙️ Integracja automatyczna: możesz wywołać <code>window.knuffelGetScore?.()</code> w kodzie gry
        i podać zwrócony wynik tutaj zamiast wpisywać ręcznie.
      </p>
    </div>
  )
}

const panelStyle = { padding:12, border:'1px solid #ddd', borderRadius:8, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }
const inp = { padding:'8px 10px', border:'1px solid #ccc', borderRadius:6, flex:1 }
const btn = { padding:'8px 12px', border:'1px solid #222', borderRadius:6, background:'#222', color:'#fff', cursor:'pointer' }
const note = { fontSize:12, color:'#555' }
