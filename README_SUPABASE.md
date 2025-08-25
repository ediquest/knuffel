# Supabase + GitHub Pages quick setup

## 1) Supabase
- Project Settings → API → skopiuj **Project URL** i **anon key**
- Authentication → URL Configuration
  - Site URL: `https://<user>.github.io/<repo>/`
  - Redirect URLs: dodaj to samo + `http://localhost:5173/*`

## 2) Env (lokalnie)
Utwórz `.env.local`:
```
VITE_SUPA_URL=...
VITE_SUPA_ANON=...
```

## 3) Production (GitHub)
Repo Settings → Secrets → Actions:
- `VITE_SUPA_URL`
- `VITE_SUPA_ANON`

## 4) Build + deploy
- `vite.config.js` → ustaw `base: '/<repo>/'`
- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Po puszu na `main` strona będzie dostępna pod `https://<user>.github.io/<repo>/`

## 5) Tabele (SQL)
Uruchom w Supabase SQL Editor:
```
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now()
);
create table if not exists scores (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null,
  points int not null check (points >= 0),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
alter table scores   enable row level security;
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "upsert own profile" on profiles for insert with check (auth.uid() = id);
create policy "public leaderboard read" on scores for select using (true);
create policy "insert own score" on scores for insert with check (auth.uid() = user_id);
```

## 6) Integracja z grą
- Panel logowania (`AuthPanel.jsx`) + Ranking (`Leaderboard.jsx`) już są.
- Aby wysyłać wynik automatycznie, w swoim kodzie gry wystaw:
```js
window.knuffelGetScore = () => /* zwróć aktualny wynik jako number */;
```
I zmodyfikuj `Leaderboard.jsx`, aby brał wynik z tej funkcji zamiast z inputa.
