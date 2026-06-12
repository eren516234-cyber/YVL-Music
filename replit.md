# YVL Music

A premium music player app with JioSaavn API integration, real-time lyrics sync, animated themes, and custom font import.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/mockup-sandbox run dev` — run the music player UI
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- UI: React + Vite (mockup-sandbox)
- API: Express 5
- Music API: JioSaavn via meloapi.vercel.app
- Lyrics: lrclib.net (LRC synced lyrics)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mockup-sandbox/src/components/mockups/music-player/FullApp.tsx` — main music player app
- `lib/api-spec/openapi.yaml` — API contract
- `.github/workflows/build.yml` — GitHub Actions: web build + APK via Capacitor

## Features

- JioSaavn API: real song streaming, search, album art
- Lyrics: 100% synced with audio using LRC timestamps from lrclib.net
- 5 lyrics modes: Line, Word, Karaoke, Bubble, Flow
- 6 animated themes: Dark, Sky, Light, Sunset, Neon, Ocean
- Custom font import via Google Fonts URL
- 5 built-in font styles
- Interactive progress bar with seek
- Shuffle, Repeat, Prev/Next
- Notification permission modal
- Mini player bar
- Settings with EQ, audio quality, cache clear

## GitHub

Repository: https://github.com/eren516234-cyber/YVL-Music
APK: GitHub Actions → Build Android APK (runs on every push to main)

## Architecture decisions

- Single FullApp.tsx contains the entire UI — keeps the mockup-sandbox self-contained
- LRC lyrics parsing keeps timestamps; polling audio.currentTime every 80ms for real-time sync
- Custom font import dynamically injects Google Fonts `<link>` tag and applies to entire app
- JioSaavn API fetched via meloapi.vercel.app proxy (no API key required)
- APK build uses Capacitor wrapping the Vite web build

## Product

YVL Music is a premium music player with real JioSaavn streaming, word-by-word lyrics sync, animated theme backgrounds (sky clouds, neon glows, ocean waves), and deep customization including custom font import from Google Fonts.

## User preferences

- App name: YVL Music
- Made by: W Shourya
- No account/login screens — removed from About and Settings
- Bold/heavy typography throughout
- GitHub: eren516234-cyber/YVL-Music

## Gotchas

- Always run `pnpm install` before typechecking after adding new dependencies
- Capacitor APK build in GitHub Actions requires Android SDK setup (handled in workflow)
- meloapi.vercel.app sometimes returns CORS errors — handled with try/catch, falls back to mockTracks

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Preview URL: `/__mockup/preview/music-player/FullApp`
