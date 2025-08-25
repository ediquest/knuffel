import React, { useEffect, useMemo, useRef, useState } from "react";

// ===== Dźwięk Yahtzee (base64) =====
// Krótkie "ding". Możesz podmienić na swój data URI.
const YAHTZEE_SOUND =
  "data:audio/wav;base64,UklGRmYAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YVQAAAAg//8A/P//AP7//wD9//8A/v//AP7//wD///8A/v//APv//wD7//8A/P//AP///wD9//8A/f//AP///wD9//8A+/8AAPv/AAA=";

// ===== Helpers =====
const randDie = () => Math.floor(Math.random() * 6) + 1;

const PIP_POS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

const Pip = ({ pos }) => (
  <span
    className="absolute w-2.5 h-2.5 md:w-3 md:h-3 bg-gray-800 rounded-full"
    style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, transform: "translate(-50%,-50%)" }}
  />
);

const UPPER_KEYS = ["ones","twos","threes","fours","fives","sixes"];
const LOWER_KEYS = ["threeKind","fourKind","fullHouse","smallStraight","largeStraight","yahtzee","chance"];
const ALL_KEYS   = [...UPPER_KEYS, ...LOWER_KEYS];

const LABELS_PL = {
  ones: "Jedynki",
  twos: "Dwójki",
  threes: "Trójki",
  fours: "Czwórki",
  fives: "Piątki",
  sixes: "Szóstki",
  threeKind: "3 takie same",
  fourKind: "4 takie same",
  fullHouse: "Full",
  smallStraight: "Mały strit",
  largeStraight: "Duży strit",
  yahtzee: "Kości",
  chance: "Szansa",
};

function Panel({title, children, className=""}){
  return (
    <div className={`bg-white rounded-xl shadow p-4 md:p-6 ${className}`}>
      <h2 className="text-lg font-bold mb-3 text-sky-700">{title}</h2>
      {children}
    </div>
  );
}

const GRID = "grid grid-cols-[110px_repeat(3,1fr)] gap-x-2 items-center py-1";
const CELL_WRAPPER = "flex items-center justify-end";
const BTN_PLACEHOLDER_W = "w-7";
const INPUT_W = "w-full max-w-[3.2rem] md:max-w-[3.5rem]";

// ===== Scoreboard (LocalStorage) =====
const LS_KEY = "kniffel.scores.v1";
const LAST_NAME_KEY = "kniffel.lastName";

function readScores() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeScores(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
function addScore(name, score){
  const cleanName = String(name || "Gracz").trim().slice(0,20) || "Gracz";
  const cleanScore = Math.max(0, Math.floor(Number(score)||0));
  const arr = readScores();
  arr.push({name: cleanName, score: cleanScore, ts: Date.now()});
  arr.sort((a,b)=> b.score - a.score || a.ts - b.ts);
  writeScores(arr.slice(0,50));
}

function colTotals(col){
  const upper = UPPER_KEYS.reduce((a,k)=>a+(col[k]??0),0);
  const bonus = upper >= 63 ? 35 : 0;
  const lower = LOWER_KEYS.reduce((a,k)=>a+(col[k]??0),0);
  return { upper, bonus, sumUpper: upper+bonus, lower, sumAll: upper+bonus+lower };
}

// ===== Totals row =====
function TotalsRow({label, columns, compute}){
  return (
    <div className={GRID}>
      <div className="pr-2 font-medium">{label}</div>
      {[0,1,2].map((colIdx)=>(
        <div key={colIdx} className={CELL_WRAPPER}>
          <span className={`${BTN_PLACEHOLDER_W} inline-block`} />
          <input
            readOnly
            value={compute(columns[colIdx])}
            className={`${INPUT_W} text-right px-2 py-1 border rounded bg-white/80`}
          />
        </div>
      ))}
    </div>
  );
}

// ===== Dice (kwadratowe) =====
const DiceBtn = ({ value, held, onToggle, yahtzee }) => (
  <button
    onClick={onToggle}
    className={`relative w-14 aspect-square md:w-16 rounded-xl border-2 flex justify-center items-center
      ${held ? "border-red-500 bg-transparent" : "border-gray-400 hover:border-sky-300 bg-transparent"}
      ${yahtzee ? "yahtzee-flash" : ""}`}
    title={held ? "Zablokowana" : "Kliknij, aby zablokować"}
  >
    <div className="absolute inset-1.5 rounded-lg bg-white shadow-inner" />
    {PIP_POS[value].map((p,i)=>(<Pip key={i} pos={p}/>))}
  </button>
);

// ===== CSS (animacje) =====
function StyleInject(){
  return (
    <style>{`
      @keyframes yahtzee-pop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.08); }
        100% { transform: scale(1); }
      }
      @keyframes yahtzee-glow {
        0%   { box-shadow: 0 0 0 rgba(34,197,94,0); }
        50%  { box-shadow: 0 0 16px rgba(34,197,94,0.65); }
        100% { box-shadow: 0 0 0 rgba(34,197,94,0); }
      }
      .yahtzee-flash {
        animation:
          yahtzee-pop 900ms ease-in-out infinite,
          yahtzee-glow 1200ms ease-in-out infinite;
      }
    `}</style>
  );
}

// ===== Main component =====
export default function Knuffel(){
  const [dice, setDice] = useState([1,2,3,4,5]);
  const [held, setHeld] = useState([false,false,false,false,false]);
  const [hasRolled, setHasRolled] = useState(false);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [awaitNext, setAwaitNext] = useState(false);
  const [lastChoice, setLastChoice] = useState(null);
  const [undone, setUndone] = useState(false);
  const [yahtzee, setYahtzee] = useState(false);

  const [columns, setColumns] = useState([
    Object.fromEntries(ALL_KEYS.map(k=>[k,null])),
    Object.fromEntries(ALL_KEYS.map(k=>[k,null])),
    Object.fromEntries(ALL_KEYS.map(k=>[k,null])),
  ]);

  // leaderboard
  const [name, setName] = useState(localStorage.getItem(LAST_NAME_KEY)||"");
  const [saved, setSaved] = useState(false);
  const allUsed = columns.every(col => ALL_KEYS.every(k => col[k] !== null));
  const weightedTotal = columns.reduce((acc, col, idx) => {
    const { sumAll } = colTotals(col);
    return acc + sumAll * (idx + 1);
  }, 0);
  const leaderboard = useMemo(()=>readScores().slice(0,10),[columns, saved]); // Top10

  // sticky (Tylko mobile)
  const [stuckShadow, setStuckShadow] = useState(false);
  const stickyRef = useRef(null);
  useEffect(()=>{
    const onScroll = () => setStuckShadow(window.innerWidth < 1024 && window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  },[]);

  // ===== AUDIO: odblokowanie po pierwszej interakcji + odtworzenie RAZ przy Yahtzee =====
  const audioCtxRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const yahtzeePlayedKey = useRef(null);

  function unlockAudioIfNeeded(){
    if (audioUnlockedRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = audioCtxRef.current || new Ctx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") ctx.resume();
      }
      audioUnlockedRef.current = true;
    } catch {}
  }

  function playYahtzeeSoundOnce(key){
    if (yahtzeePlayedKey.current === key) return; // zagraj tylko raz dla tej konfiguracji
    yahtzeePlayedKey.current = key;
    try {
      // spróbuj HTMLAudio
      const a = new Audio(YAHTZEE_SOUND);
      a.currentTime = 0;
      a.play().catch(async () => {
        // fallback: WebAudio (krótki „ding”)
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          const ctx = audioCtxRef.current || (Ctx ? new Ctx() : null);
          if (!ctx) return;
          if (ctx.state === "suspended") await ctx.resume();
          audioCtxRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      });
    } catch {}
  }

  function newGame(){
    setDice([1,2,3,4,5]);
    setHeld([false,false,false,false,false]);
    setHasRolled(false);
    setRollsLeft(3);
    setAwaitNext(false);
    setLastChoice(null);
    setUndone(false);
    setYahtzee(false);
    setColumns([
      Object.fromEntries(ALL_KEYS.map(k=>[k,null])),
      Object.fromEntries(ALL_KEYS.map(k=>[k,null])),
      Object.fromEntries(ALL_KEYS.map(k=>[k,null])),
    ]);
    setSaved(false);
    yahtzeePlayedKey.current = null; // reset „zagrano”
  }

  function toggleHold(i){
    if (!hasRolled || rollsLeft===0 || awaitNext) return;
    setHeld(h => h.map((v,idx)=> idx===i ? !v : v));
  }

  function finishRoll(finalVals){
    setDice(finalVals);
    setHasRolled(true);
    setRollsLeft(r=>r-1);
    const isY = finalVals.every(v => v===finalVals[0]);
    setYahtzee(isY);
    if (isY) {
      const key = finalVals.join("-");
      playYahtzeeSoundOnce(key); // ← dźwięk gra RAZ
    }
  }

  function roll(){
    if (rollsLeft<=0 || awaitNext) return;
    unlockAudioIfNeeded(); // odblokuj audio w geście użytkownika
    let t=0;
    const timer = setInterval(()=>{
      setDice(prev=>prev.map((d,i)=> held[i] ? d : randDie()));
      t+=50;
      if(t>=800){
        clearInterval(timer);
        const finalVals = dice.map((d,i)=> held[i] ? d : randDie());
        finishRoll(finalVals);
      }
    },50);
  }

  function nextRound(){
    unlockAudioIfNeeded(); // odblokuj audio w geście użytkownika
    setHeld([false,false,false,false,false]);
    setAwaitNext(false);
    setLastChoice(null);
    setUndone(false);

    // animacja + pierwszy rzut nowej rundy
    let t = 0;
    const timer = setInterval(() => {
      setDice([randDie(), randDie(), randDie(), randDie(), randDie()]);
      t += 50;
      if (t >= 800) {
        clearInterval(timer);
        const finalVals = [randDie(), randDie(), randDie(), randDie(), randDie()];
        // NIE wywołujemy finishRoll(), żeby nie zmniejszać rollsLeft
        setDice(finalVals);
        setHasRolled(true);
        setRollsLeft(2); // 1. rzut wykonany -> zostają 2
        const isY = finalVals.every(v => v === finalVals[0]);
        setYahtzee(isY);
        if (isY) {
          const key = finalVals.join("-");
          playYahtzeeSoundOnce(key); // dźwięk gra RAZ
        }
      }
    }, 50);
  }

  function commitScore(colIdx,k){
    if (!hasRolled || awaitNext || columns[colIdx][k]!==null) return;
    const v = scoreFor(k,dice);
    setColumns(prev=>{
      const copy = prev.map(c=>({...c}));
      copy[colIdx][k] = v;
      return copy;
    });
    setAwaitNext(true);
    setLastChoice([colIdx,k]);
    setUndone(false);
    setYahtzee(false);           // wyłącz animację
    yahtzeePlayedKey.current = null; // pozwól na kolejne „RAZ” przy następnym Yahtzee
  }

  function undoChoice(){
    if(!lastChoice) return;
    const [colIdx,k]=lastChoice;
    setColumns(prev=>{
      const copy = prev.map(c=>({...c}));
      copy[colIdx][k] = null;
      return copy;
    });
    setAwaitNext(false);
    setLastChoice(null);
    setUndone(true);
  }

  function gameMessage(){
    if (awaitNext){
      if (undone) return "Wybór cofnięty. Zapisz swoje punkty.";
      return "Następna runda. Rzuć kostkami!";
    }
    if (!hasRolled) return "Po pierwszym rzucie - Aby zatrzymać kość po prostu na nią naciśnij.";
    if (rollsLeft===2) return "Po pierwszym rzucie - Aby zatrzymać kość po prostu na nią naciśnij.";
    if (rollsLeft===1) return "Po drugim rzucie - Aby zatrzymać kość po prostu na nią naciśnij.";
    if (rollsLeft===0) return "Po statnim rzucie - Zapisz swoje punkty!";
    return "";
  }

  function saveScore(){
    addScore(name, weightedTotal);
    localStorage.setItem(LAST_NAME_KEY, String(name||"").trim().slice(0,20));
    setSaved(true);
  }

  // Ikony 1..10 (możesz zmienić mapę według gustu)
  const rankIcon = (i) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    const map = [
      "💎", // 4
      "⭐", // 5
      "🌟", // 6
      "✨", // 7
      "🎉", // 8
      "✋", // 9
      "🍀"  // 10
    ];
    return map[i - 3] || "•";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-100 to-gray-200 text-gray-900">
      <StyleInject />
      <div className="max-w-[420px] sm:max-w-xl lg:max-w-6xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {/* ===== UKŁAD: mobile kolejność; desktop: Punkty po lewej; prawa kolumna: Stół, Top10, Reset ===== */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* PRAWA KOLUMNA (desktop) – wrapper: Stół do gry + Top10 + Reset */}
  <div className="order-1 lg:order-2 lg:col-start-3 lg:col-span-1">
    {/* Stół do gry – sticky tylko na telefonie */}
    <div
      ref={stickyRef}
      className={`sticky top-0 z-40 transition-shadow lg:static lg:top-auto ${stuckShadow ? "shadow-md" : "shadow-none"}`}
    >
      <Panel title="Stół do gry" className="shadow-none bg-white/95 backdrop-blur-sm lg:bg-white lg:backdrop-blur-0">
        {/* ======= ZOSTAW Twoją obecną zawartość Stołu do gry BEZ ZMIAN ======= */}
        <div className="space-y-3">
<textarea
  readOnly
  spellCheck={false}
  className="w-full h-16 border rounded p-2 bg-white/70 text-center resize-none select-none overflow-hidden"
  value={gameMessage()}
/>
          <div className="flex justify-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
            {dice.map((d,i)=>(
              <DiceBtn key={i} value={d} held={held[i]} yahtzee={yahtzee} onToggle={()=>toggleHold(i)} />
            ))}
          </div>

          {/* Rzut / przyciski rundy / nowa gra */}
          {!awaitNext && !allUsed && rollsLeft>0 && (
            <button
              onClick={roll}
              className="w-full py-2 rounded border border-sky-600 text-sky-700 font-semibold hover:bg-sky-50 whitespace-nowrap"
            >
              {rollsLeft===3 ? "Pierwszy rzut" : rollsLeft===2 ? "Drugi rzut" : "Ostatni rzut"}
            </button>
          )}
          {awaitNext && !allUsed && (
            <div className="flex flex-col gap-3">
              <button
                onClick={nextRound}
                className="w-full py-2 rounded border border-sky-500 text-sky-700 font-semibold hover:bg-sky-50 whitespace-nowrap"
              >
                Następna runda
              </button>
              <button
                onClick={undoChoice}
                className="w-full py-2 rounded border border-red-500 text-red-600 font-semibold hover:bg-red-50 whitespace-nowrap"
              >
                Cofnij ostatni wybór
              </button>
            </div>
          )}
          {allUsed && (
            <button
              onClick={newGame}
              className="w-full py-2 rounded border border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 whitespace-nowrap"
            >
              Nowa gra
            </button>
          )}
        </div>
      </Panel>
    </div>

    {/* Top 10 i Reset – ZAWSZE pod Stołem do gry w tej samej kolumnie na desktopie */}
    <div className="flex flex-col gap-6 mt-6">
      <Panel title="Top 10">
        {leaderboard.length===0 ? (
          <div className="text-sm opacity-70">Brak wyników.</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((s,i)=>(
              <div key={s.ts} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{rankIcon(i)}</span>
                  <span className="font-semibold">{i+1}. {s.name}</span>
                </div>
                <div className="font-bold tabular-nums">{s.score}</div>
              </div>
            ))}
          </div>
        )}
        {allUsed && (
          <div className="mt-3 border-t pt-3">
            <div className="text-sm mb-2 opacity-80">Zapisz wynik na tej przeglądarce:</div>
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Twoje imię"
                className="flex-1 px-3 py-2 border rounded"
                maxLength={20}
              />
              <button
                onClick={()=>{
                  addScore(name, weightedTotal);
                  localStorage.setItem(LAST_NAME_KEY, String(name||"").trim().slice(0,20));
                  setSaved(true);
                }}
                disabled={saved}
                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
              >
                {saved ? "Zapisano ✓" : "Zapisz"}
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Zresetuj">
        <div className="space-y-3">
          <button onClick={newGame} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50">
            Restart
          </button>
          <div className="text-xs opacity-70">Zresetuje kości i planszę punktacji.</div>
        </div>
      </Panel>
    </div>
  </div>

  {/* LEWA, Szeroka część – Punkty */}
  <div className="order-2 lg:order-1 lg:col-span-2">
    <Panel title="Punkty" className="text-[13px] md:text-base">
      {/* ======= ZOSTAW Twoją obecną zawartość PUNKTÓW BEZ ZMIAN ======= */}
<div className={GRID + " px-1"}>
  <div />
  <div className="text-center font-semibold text-sky-700 text-xs md:text-sm">X 1</div>
  <div className="text-center font-semibold text-sky-700 text-xs md:text-sm">X 2</div>
  <div className="text-center font-semibold text-sky-700 text-xs md:text-sm">X 3</div>
</div>

      <div className="divide-y">
        {UPPER_KEYS.map((k)=>(
          <Row
            key={k}
            k={k}
            columns={columns}
            hasRolled={hasRolled}
            awaitNext={awaitNext}
            commitScore={commitScore}
          />
        ))}

        <TotalsRow
          label="Suma"
          columns={columns}
          compute={(c)=> UPPER_KEYS.reduce((a,k)=>a+(c[k]??0),0)}
        />
        <TotalsRow
          label="Bonus (jeśli 63 lub więcej)"
          columns={columns}
          compute={(c)=>{ const u=UPPER_KEYS.reduce((a,k)=>a+(c[k]??0),0); return u>=63?35:0; }}
        />
        <TotalsRow
          label="Suma Górna:"
          columns={columns}
          compute={(c)=>{ const u=UPPER_KEYS.reduce((a,k)=>a+(c[k]??0),0); return u + (u>=63?35:0); }}
        />

        {LOWER_KEYS.map((k)=>(
          <Row
            key={k}
            k={k}
            columns={columns}
            hasRolled={hasRolled}
            awaitNext={awaitNext}
            commitScore={commitScore}
          />
        ))}

        <TotalsRow
          label="Suma:"
          columns={columns}
          compute={(c)=> LOWER_KEYS.reduce((a,k)=>a+(c[k]??0),0)}
        />
        <TotalsRow
          label="Suma Górna:"
          columns={columns}
          compute={(c)=>{ const u=UPPER_KEYS.reduce((a,k)=>a+(c[k]??0),0); return u + (u>=63?35:0); }}
        />
        <TotalsRow
          label="Razem:"
          columns={columns}
          compute={(c)=> {
            const { sumAll } = colTotals(c);
            return sumAll;
          }}
        />

        <div className={`${GRID} font-semibold`}>
          <div className="pr-2">Suma w kolumnie:</div>
          {[0,1,2].map((colIdx)=> {
            const { sumAll } = colTotals(columns[colIdx]);
            const mult = colIdx+1;
            return (
              <div key={colIdx} className={CELL_WRAPPER}>
                <span className={`${BTN_PLACEHOLDER_W} hidden sm:inline-block text-sm text-gray-600 whitespace-nowrap text-right`}>x {mult} =</span>
                <input readOnly value={sumAll * mult} className={`${INPUT_W} text-right px-2 py-1 border rounded bg-white/80`} />
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center py-3 border-t mt-2">
          <span className="font-bold text-sky-700 mr-3">RAZEM PUNKTÓW:</span>
          <input
            readOnly
            value={columns.reduce((acc,col,idx)=>{
              const { sumAll } = colTotals(col);
              return acc + sumAll * (idx+1);
            },0)}
            className="w-24 text-center px-2 py-1 border rounded bg-white/90 font-bold"
          />
        </div>
      </div>
    </Panel>
  </div>
</div>

      </div>
    </div>
  );
}

function Row({k, columns, hasRolled, awaitNext, commitScore}){
  return (
    <div className={GRID}>
      <div className="text-xs md:text-sm">{LABELS_PL[k]}</div>
      {[0,1,2].map((colIdx)=>{
        const used = columns[colIdx][k] !== null;
        const val  = columns[colIdx][k];
        return (
          <div key={colIdx} className={CELL_WRAPPER}>
            {(!used && hasRolled && !awaitNext) ? (
              <button
                className={`${BTN_PLACEHOLDER_W} px-2 py-1 text-xs rounded border border-sky-400 text-sky-700 hover:bg-sky-50`}
                onClick={()=>commitScore(colIdx,k)}
                title="Zapisz do tej kolumny"
              >
                »
              </button>
            ) : (
              <span className={`${BTN_PLACEHOLDER_W} inline-block`} />
            )}
            <input
              readOnly
              value={used ? val : "-"}
              className={`${INPUT_W} text-right px-2 py-1 border rounded bg-white/80`}
            />
          </div>
        );
      })}
    </div>
  );
}

function scoreFor(k,dice){
  const cnt = [0,0,0,0,0,0,0];
  dice.forEach(d=>cnt[d]++);
  const sum = dice.reduce((a,b)=>a+b,0);
  switch(k){
    case "ones": return cnt[1]*1;
    case "twos": return cnt[2]*2;
    case "threes": return cnt[3]*3;
    case "fours": return cnt[4]*4;
    case "fives": return cnt[5]*5;
    case "sixes": return cnt[6]*6;
    case "threeKind": return cnt.some(c=>c>=3) ? sum : 0;
    case "fourKind": return cnt.some(c=>c>=4) ? sum : 0;
    case "fullHouse": return cnt.includes(3) && cnt.includes(2) ? 25 : 0;
    case "smallStraight": return hasStraight(cnt,4) ? 30 : 0;
    case "largeStraight": return hasStraight(cnt,5) ? 40 : 0;
    case "yahtzee": return cnt.some(c=>c===5) ? 50 : 0;
    case "chance": return sum;
    default: return 0;
  }
}

function hasStraight(counts,len){
  const nums = counts.map((c,i)=>c>0?i:0).filter(x=>x>0);
  const uniq = [...new Set(nums)].sort();
  let run=1,maxRun=1;
  for(let i=1;i<uniq.length;i++){
    if(uniq[i]===uniq[i-1]+1){ run++; maxRun=Math.max(maxRun,run); }
    else run=1;
  }
  return maxRun>=len;
}
