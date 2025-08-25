import React from "react";
import Knuffel from "./Knuffel.jsx";
import AuthPanel from "./AuthPanel.jsx";
import Leaderboard from "./Leaderboard.jsx";

export default function App() {
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:16, padding:16}}>
      <div>
        <Knuffel />
      </div>
      <div style={{position:'sticky', top:16, display:'flex', flexDirection:'column', gap:12}}>
        <AuthPanel />
        <Leaderboard game="knuffel" />
      </div>
    </div>
  );
}
