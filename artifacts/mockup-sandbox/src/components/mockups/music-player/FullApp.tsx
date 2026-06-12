import React, { useState, useEffect, useRef, useCallback } from "react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Serif+Display&family=Nunito:wght@400;600;700;800;900&family=VT323&family=Bebas+Neue&display=swap');
    @keyframes vinylSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
    @keyframes cloudDrift { from { transform: translateX(0) } to { transform: translateX(-50%) } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
    @keyframes sunsetShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes twinkle { 0%,100% { opacity:0.15; transform:scale(0.7); } 50% { opacity:1; transform:scale(1.3); } }
    @keyframes floatUp { 0% { transform:translateY(0) scale(0.8); opacity:0; } 70% { opacity:0.7; } 100% { transform:translateY(-160px) scale(1); opacity:0; } }
    @keyframes glitch { 0%,100%{clip-path:inset(0 0 100% 0)} 10%{clip-path:inset(20% 0 40% 0)} 30%{clip-path:inset(60% 0 10% 0)} 50%{clip-path:inset(10% 0 70% 0)} 70%{clip-path:inset(80% 0 5% 0)} 90%{clip-path:inset(5% 0 85% 0)} }
    @keyframes splashPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
    @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
    @keyframes neonShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes neonPulse { 0%,100%{opacity:0.5;filter:blur(60px)} 50%{opacity:0.85;filter:blur(40px)} }
    @keyframes neonGlow { 0%,100%{box-shadow:0 0 30px #ff0080,0 0 60px #ff008044} 50%{box-shadow:0 0 60px #00ffff,0 0 120px #00ffff44} }
    @keyframes oceanWave { 0%{transform:translateX(0) scaleY(1)} 50%{transform:translateX(-30px) scaleY(1.15)} 100%{transform:translateX(0) scaleY(1)} }
    @keyframes oceanShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes lyricsHighlight { 0%{opacity:0.8;transform:scale(1)} 100%{opacity:0;transform:scale(1.4)} }
    @keyframes flowReveal { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes bubbleFloat { 0%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-8px) scale(1.04)} 100%{transform:translateY(0px) scale(1)} }
    @keyframes lyricsPop { 0%{transform:scale(0.9);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .lyrics-line-active { animation: lyricsPop 0.3s ease both; }
  `}</style>
);

interface LyricsLine { time: number; text: string; }
interface Track {
  id: number; title: string; artist: string; album: string;
  artId: number; artUrl?: string; previewUrl?: string | null;
  duration: string; durationSec: number; explicit: boolean;
  streams: string; genre?: string; saavnId?: string;
}

const fetchSaavnSearch = async (query: string): Promise<Track[]> => {
  try {
    const res = await fetch(`https://meloapi.vercel.app/api/search/songs?query=${encodeURIComponent(query)}&limit=25`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success) return [];
    const results: any[] = data.data?.results ?? [];
    return results.map((x: any, i: number): Track => {
      const artistName = (x.artists?.primary ?? []).map((a: any) => a.name).join(", ") || "Unknown";
      const bestImg = (x.image ?? []).slice(-1)[0]?.url ?? "";
      const durationSec = Number(x.duration) || 0;
      const mins = Math.floor(durationSec / 60);
      const secs = String(durationSec % 60).padStart(2, "0");
      const bestUrl = (x.downloadUrl ?? []).slice(-1)[0]?.url ?? null;
      return {
        id: i + 1, title: x.name ?? "Unknown", artist: artistName,
        album: x.album?.name ?? "", artUrl: bestImg,
        previewUrl: bestUrl,
        duration: durationSec ? `${mins}:${secs}` : "0:00",
        durationSec, explicit: !!x.explicitContent,
        streams: `${Math.floor(Math.random() * 500 + 10)}M`,
        artId: i % 8, genre: "", saavnId: x.id ?? "",
      };
    });
  } catch { return []; }
};

const fetchSyncedLyrics = async (title: string, artist: string): Promise<LyricsLine[]> => {
  const clean = (s: string) => s.replace(/\s*\(.*?(official|video|audio|lyrics|remix|live).*?\)/gi, "").replace(/\s*feat\..*$/gi, "").trim();
  const ct = clean(title);
  const ca = artist.split(/\s*[,&]\s*|\s+and\s+/i)[0].trim();
  const attempts = [
    `https://lrclib.net/api/search?track_name=${encodeURIComponent(ct)}&artist_name=${encodeURIComponent(ca)}`,
    `https://lrclib.net/api/search?track_name=${encodeURIComponent(ct)}`,
    `https://lrclib.net/api/search?q=${encodeURIComponent(ca + " " + ct)}`,
  ];
  for (const url of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const tracks: any[] = await res.json();
      const match = tracks.find(t => t.syncedLyrics || t.plainLyrics);
      if (!match) continue;
      if (match.syncedLyrics) {
        const lines = match.syncedLyrics.split("\n").map((line: string) => {
          const m = line.match(/^\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
          if (!m) return null;
          const time = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 100;
          const text = m[4].trim();
          return text ? { time, text } : null;
        }).filter(Boolean) as LyricsLine[];
        if (lines.length > 0) return lines;
      }
      if (match.plainLyrics) {
        const lines = match.plainLyrics.split("\n").filter((l: string) => l.trim());
        const avgDur = 3.5;
        return lines.map((text: string, i: number) => ({ time: i * avgDur, text }));
      }
    } catch {}
  }
  return [];
};

const mockTracks: Track[] = [
  { id: 1, title: "Tuscan Leather", artist: "Drake", album: "Nothing Was The Same", explicit: true, streams: "127M", duration: "6:06", durationSec: 366, artId: 0 },
  { id: 2, title: "Furthest Thing", artist: "Drake", album: "Nothing Was The Same", explicit: false, streams: "89M", duration: "5:24", durationSec: 324, artId: 1 },
  { id: 3, title: "Started From the Bottom", artist: "Drake", album: "Nothing Was The Same", explicit: true, streams: "312M", duration: "3:14", durationSec: 194, artId: 2 },
  { id: 4, title: "Own It", artist: "Drake", album: "Nothing Was The Same", explicit: false, streams: "45M", duration: "2:57", durationSec: 177, artId: 4 },
  { id: 5, title: "Come Thru", artist: "Drake", album: "Nothing Was The Same", explicit: false, streams: "35M", duration: "2:56", durationSec: 176, artId: 7 },
];

const mockSyncedLyrics: LyricsLine[] = [
  { time: 0, text: "Yeah, look" }, { time: 3.5, text: "Tuscan Leather smelling like a brick" },
  { time: 7, text: "Degenerates, but even Ellen love our shit" }, { time: 10.5, text: "Rich enough that I don't have to tell 'em that I'm rich" },
  { time: 14, text: "Self explanatory, you just here to spread the story" }, { time: 17.5, text: "Man, this shit is barely out of the box" },
  { time: 21, text: "And I'm already in it, so I ain't trying to drop" }, { time: 24.5, text: "Look, I'm just getting started" },
  { time: 28, text: "Yeah, I'm just getting started" }, { time: 31.5, text: "Off with the safety — no hesitating" },
];

type FontStyleType = "bold" | "classic" | "modern" | "rounded" | "retro" | "custom";
const fontStyleMap: Record<string, { family: string; label: string }> = {
  bold:    { family: "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", label: "Bold" },
  classic: { family: "'DM Serif Display', Georgia, serif",                                       label: "Classic" },
  modern:  { family: "'Bebas Neue', 'Inter', Arial, sans-serif",                                  label: "Modern" },
  rounded: { family: "'Nunito', ui-rounded, system-ui, sans-serif",                               label: "Rounded" },
  retro:   { family: "'VT323', 'Courier New', monospace",                                          label: "Retro" },
  custom:  { family: "inherit",                                                                    label: "Custom" },
};

type ThemeType = "dark" | "sky" | "light" | "sunset" | "neon" | "ocean";
interface ThemeColors {
  bg: string; surface: string; surfaceAlt: string; text: string; textSub: string;
  textMuted: string; accent: string; accentText: string; border: string;
  pillActiveBg: string; pillActiveText: string; pillInactiveBg: string;
  pillInactiveText: string; navBg: string; isDark: boolean;
}
const getTheme = (theme: ThemeType): ThemeColors => {
  switch (theme) {
    case "sky": return { bg: "linear-gradient(175deg,#4ab3f4 0%,#74c7f7 30%,#a8ddf9 55%,#d4effe 70%,#f0f8ff 80%,#ffffff 90%)", surface: "rgba(255,255,255,0.82)", surfaceAlt: "rgba(255,255,255,0.6)", text: "#1a1a1a", textSub: "#555", textMuted: "#888", accent: "#4ab3f4", accentText: "#fff", border: "rgba(0,0,0,0.08)", pillActiveBg: "#4ab3f4", pillActiveText: "#fff", pillInactiveBg: "transparent", pillInactiveText: "#555", navBg: "#fff", isDark: false };
    case "light": return { bg: "#fff", surface: "#f5f5f5", surfaceAlt: "#ececec", text: "#111", textSub: "#555", textMuted: "#888", accent: "#007aff", accentText: "#fff", border: "rgba(0,0,0,0.08)", pillActiveBg: "#007aff", pillActiveText: "#fff", pillInactiveBg: "transparent", pillInactiveText: "#555", navBg: "#fff", isDark: false };
    case "sunset": return { bg: "#120509", surface: "rgba(80,20,25,0.65)", surfaceAlt: "rgba(100,30,20,0.5)", text: "#fff0ec", textSub: "#ffb899", textMuted: "#a05040", accent: "#ff6b35", accentText: "#fff", border: "rgba(255,107,53,0.18)", pillActiveBg: "#ff6b35", pillActiveText: "#fff", pillInactiveBg: "transparent", pillInactiveText: "#ffb899", navBg: "rgba(18,5,9,0.95)", isDark: true };
    case "neon": return { bg: "#050010", surface: "rgba(255,0,128,0.1)", surfaceAlt: "rgba(0,255,255,0.08)", text: "#fff", textSub: "#ff80c0", textMuted: "#aa3366", accent: "#ff0080", accentText: "#fff", border: "rgba(255,0,128,0.25)", pillActiveBg: "#ff0080", pillActiveText: "#fff", pillInactiveBg: "transparent", pillInactiveText: "#ff80c0", navBg: "rgba(5,0,16,0.97)", isDark: true };
    case "ocean": return { bg: "#000d1a", surface: "rgba(0,100,180,0.22)", surfaceAlt: "rgba(0,60,120,0.18)", text: "#e0f7ff", textSub: "#7ecfff", textMuted: "#3388bb", accent: "#00d4ff", accentText: "#000d1a", border: "rgba(0,212,255,0.2)", pillActiveBg: "#00d4ff", pillActiveText: "#000d1a", pillInactiveBg: "transparent", pillInactiveText: "#7ecfff", navBg: "rgba(0,13,26,0.97)", isDark: true };
    default: return { bg: "#0d0d0d", surface: "#1a1a1a", surfaceAlt: "#242424", text: "#fff", textSub: "#888", textMuted: "#555", accent: "#fff", accentText: "#000", border: "rgba(255,255,255,0.08)", pillActiveBg: "#fff", pillActiveText: "#000", pillInactiveBg: "transparent", pillInactiveText: "#777", navBg: "#0d0d0d", isDark: true };
  }
};

const IHome = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const ISearch = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ILyrics = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const ILibrary = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const ISettings2 = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const IPlay = ({ c="currentColor", s=24, filled=false }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IPause = ({ c="currentColor", s=24, filled=false }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const IPrev = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>;
const INext = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>;
const IChevL = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IChevD = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IChevR = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IHeart = ({ c="currentColor", s=24, filled=false }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const IPlus = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IShuffle = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const IRepeat = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>;
const ICheck = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IMenu = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IFont = ({ c="currentColor", s=24 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;

const Art0 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g0" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7b2d8b"/><stop offset="100%" stopColor="#0077b6"/></linearGradient></defs><rect width="100" height="100" fill="url(#g0)"/><circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.2)"/></svg>;
const Art1 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g1" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ff8c00"/><stop offset="100%" stopColor="#e65100"/></linearGradient></defs><rect width="100" height="100" fill="url(#g1)"/><path d="M0,50 Q25,25 50,50 T100,50" stroke="rgba(255,255,255,0.3)" strokeWidth="10" fill="none"/></svg>;
const Art2 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00b4d8"/><stop offset="100%" stopColor="#0077b6"/></linearGradient></defs><rect width="100" height="100" fill="url(#g2)"/><line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="20"/><line x1="50" y1="-50" x2="150" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="20"/></svg>;
const Art3 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g3" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stopColor="#e91e8c"/><stop offset="100%" stopColor="#4a148c"/></linearGradient></defs><rect width="100" height="100" fill="url(#g3)"/><circle cx="20" cy="20" r="5" fill="rgba(255,255,255,0.4)"/><circle cx="80" cy="80" r="5" fill="rgba(255,255,255,0.4)"/><circle cx="20" cy="80" r="5" fill="rgba(255,255,255,0.4)"/><circle cx="80" cy="20" r="5" fill="rgba(255,255,255,0.4)"/><circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.4)"/></svg>;
const Art4 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g4" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#1da1f2"/><stop offset="100%" stopColor="#283593"/></linearGradient></defs><rect width="100" height="100" fill="url(#g4)"/><path d="M0,80 Q25,60 50,80 T100,80 L100,100 L0,100 Z" fill="rgba(255,255,255,0.2)"/></svg>;
const Art5 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><radialGradient id="g5" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffb703"/><stop offset="100%" stopColor="#fb8500"/></radialGradient></defs><rect width="100" height="100" fill="url(#g5)"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5"/></svg>;
const Art6 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff4d6d"/><stop offset="100%" stopColor="#c9184a"/></linearGradient></defs><rect width="100" height="100" fill="url(#g6)"/><polygon points="0,100 100,0 100,100" fill="rgba(255,255,255,0.15)"/></svg>;
const Art7 = () => <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g7" x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#5c6bc0"/><stop offset="100%" stopColor="#3f51b5"/></linearGradient></defs><rect width="100" height="100" fill="url(#g7)"/><rect x="25" y="25" width="50" height="50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" transform="rotate(45 50 50)"/></svg>;

const AlbumArt = ({ index = 0, artUrl = "" }: { index?: number; artUrl?: string }) => {
  if (artUrl) return <img src={artUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />;
  const comps = [Art0, Art1, Art2, Art3, Art4, Art5, Art6, Art7];
  const Comp = comps[index % 8] || Art0;
  return <Comp />;
};

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function NotifModal({ onAllow, onDeny, t }: any) {
  return (
    <div style={{ position:"absolute",inset:0,zIndex:200,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(12px)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 12px 40px",animation:"slideUp 0.35s ease" }}>
      <div style={{ width:"100%",background:t.isDark?"rgba(28,28,32,0.98)":"rgba(255,255,255,0.98)",borderRadius:28,padding:"32px 24px 24px",border:`1px solid ${t.border}` }}>
        <div style={{ width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,#dc143c,#ff4d6d)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 8px 24px rgba(220,20,60,0.4)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2C12 2 6 6 6 13H18C18 6 12 2 12 2Z"/><rect x="9" y="13" width="6" height="4" rx="2"/><rect x="10.5" y="17" width="3" height="2" rx="1"/></svg>
        </div>
        <div style={{ fontSize:22,fontWeight:900,color:t.text,textAlign:"center",marginBottom:10,lineHeight:1.2 }}>YVL Wants to Send<br/>You Notifications</div>
        <div style={{ fontSize:14,fontWeight:600,color:t.textSub,textAlign:"center",lineHeight:1.6,marginBottom:28 }}>Get notified when new drops land, your downloads finish, and your favorites release something fire.</div>
        <div style={{ display:"flex",gap:10 }}>
          <div onClick={onDeny} style={{ flex:1,padding:"15px",textAlign:"center",borderRadius:18,background:t.surfaceAlt,color:t.text,fontWeight:800,fontSize:15,cursor:"pointer",border:`1px solid ${t.border}` }}>Not Now</div>
          <div onClick={onAllow} style={{ flex:2,padding:"15px",textAlign:"center",borderRadius:18,background:"linear-gradient(135deg,#dc143c,#ff4d6d)",color:"white",fontWeight:900,fontSize:15,cursor:"pointer",boxShadow:"0 6px 20px rgba(220,20,60,0.4)" }}>Allow Notifications</div>
        </div>
      </div>
    </div>
  );
}

function SplashScreen({ nameInput, setNameInput, onEnter, fontFamily }: any) {
  const stars = Array.from({ length: 30 }, (_, i) => ({ x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1, delay: (i % 5) * 0.6, dur: (i % 3) + 2 }));
  return (
    <div style={{ width:375,height:812,borderRadius:40,overflow:"hidden",background:"#000",position:"relative",fontFamily,boxShadow:"0 32px 80px rgba(0,0,0,0.8)" }}>
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%" }} viewBox="0 0 375 812">
        {stars.map((s,i) => <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.size} fill="white" style={{ animation:`twinkle ${s.dur}s ${s.delay}s ease-in-out infinite` }} />)}
      </svg>
      <div style={{ position:"absolute",top:0,right:0,width:200,height:400,background:"linear-gradient(135deg,transparent 40%,rgba(220,20,60,0.12) 100%)" }} />
      <div style={{ position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 32px" }}>
        <div style={{ marginBottom:8,animation:"splashPulse 3s ease-in-out infinite" }}>
          <div style={{ fontSize:80,fontWeight:900,color:"#fff",letterSpacing:-4,lineHeight:1,textAlign:"center" }}>YVL</div>
          <div style={{ width:"100%",height:3,background:"linear-gradient(90deg,transparent,#dc143c,transparent)",marginTop:4 }} />
        </div>
        <div style={{ fontSize:13,letterSpacing:6,color:"rgba(255,255,255,0.4)",fontWeight:600,marginBottom:80,textTransform:"uppercase" }}>MUSIC</div>
        <div style={{ width:"100%",animation:"slideUp 0.8s ease both",animationDelay:"0.3s" }}>
          <div style={{ fontSize:14,color:"rgba(255,255,255,0.5)",fontWeight:600,marginBottom:10,letterSpacing:1,textTransform:"uppercase" }}>What's your name?</div>
          <input value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === "Enter" && onEnter()} placeholder="Enter your name..." style={{ width:"100%",padding:"16px 20px",fontSize:18,fontWeight:700,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,color:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:16 }} />
          <div onClick={onEnter} style={{ width:"100%",padding:"16px",textAlign:"center",background:nameInput.trim()?"#dc143c":"rgba(255,255,255,0.1)",borderRadius:16,fontSize:16,fontWeight:800,color:"#fff",cursor:"pointer",letterSpacing:1,transition:"all 0.2s ease" }}>LET'S GO</div>
        </div>
        <div style={{ position:"absolute",bottom:40,fontSize:11,color:"rgba(255,255,255,0.2)",letterSpacing:2 }}>YVL · MUSIC · v3.0</div>
      </div>
    </div>
  );
}

function HomeScreen({ navigate, playTrack, t, tracks, isPlaying, activeTrackId, fontFamily }: any) {
  const displayTracks: Track[] = tracks?.length > 0 ? tracks : mockTracks;
  const [scrolled, setScrolled] = useState(false);
  return (
    <div className="hide-scrollbar" onScroll={(e) => setScrolled((e.target as HTMLDivElement).scrollTop > 30)} style={{ height:"100%",overflowY:"auto",paddingBottom:80 }}>
      <div style={{ padding:"50px 20px 0",marginBottom:24 }}>
        <div style={{ fontSize:32,fontWeight:900,color:t.text,letterSpacing:-1,marginBottom:4,fontFamily }}>Good evening 👋</div>
        <div style={{ fontSize:15,fontWeight:600,color:t.textSub }}>What do you want to listen to?</div>
      </div>
      {/* Featured horizontal scroll */}
      <div className="hide-scrollbar" style={{ display:"flex",gap:12,overflowX:"auto",paddingLeft:20,paddingRight:20,marginBottom:32 }}>
        {displayTracks.slice(0,6).map((tr: Track) => (
          <div key={tr.id} onClick={() => playTrack(tr.id)} style={{ flexShrink:0,cursor:"pointer" }}>
            <div style={{ width:130,height:130,borderRadius:20,overflow:"hidden",marginBottom:8,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",position:"relative" }}>
              <AlbumArt index={tr.artId} artUrl={tr.artUrl} />
              {activeTrackId === tr.id && <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center" }}><div style={{ width:36,height:36,borderRadius:"50%",background:"white",display:"flex",alignItems:"center",justifyContent:"center" }}>{isPlaying ? <IPause c="black" s={18} filled /> : <IPlay c="black" s={18} filled />}</div></div>}
            </div>
            <div style={{ fontSize:13,fontWeight:800,color:t.text,width:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tr.title}</div>
            <div style={{ fontSize:11,fontWeight:600,color:t.textSub,width:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tr.artist}</div>
          </div>
        ))}
      </div>
      {/* Track list */}
      <div style={{ padding:"0 20px" }}>
        <div style={{ fontSize:20,fontWeight:900,color:t.text,marginBottom:16,fontFamily }}>Top Tracks</div>
        {displayTracks.map((tr: Track) => (
          <div key={tr.id} onClick={() => playTrack(tr.id)} style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16,cursor:"pointer",padding:"8px 12px",borderRadius:16,background:activeTrackId===tr.id?t.surface:"transparent",border:activeTrackId===tr.id?`1px solid ${t.border}`:"1px solid transparent",transition:"all 0.2s" }}>
            <div style={{ width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0 }}><AlbumArt index={tr.artId} artUrl={tr.artUrl} /></div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:15,fontWeight:800,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2 }}>{tr.title}</div>
              <div style={{ fontSize:12,fontWeight:600,color:t.textSub }}>{tr.artist} · {tr.streams}</div>
            </div>
            {activeTrackId===tr.id && isPlaying && <div style={{ width:20,height:20,display:"flex",alignItems:"center",gap:2 }}>{[1,2,3].map(i=><div key={i} style={{ width:3,borderRadius:2,background:t.accent,animation:`pulse ${0.5+i*0.2}s ease-in-out infinite alternate`,height:`${8+i*4}px` }} />)}</div>}
            <div style={{ fontSize:12,color:t.textMuted,fontWeight:600,flexShrink:0 }}>{tr.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchScreen({ navigate, playTrack, t, onSearch, isLoading, tracks, fontFamily }: any) {
  const [q, setQ] = useState("");
  const displayTracks: Track[] = tracks?.length > 0 ? tracks : [];
  const handleSearch = () => { if (q.trim()) onSearch(q); };
  return (
    <div className="hide-scrollbar" style={{ height:"100%",overflowY:"auto",padding:"50px 20px 80px" }}>
      <div style={{ fontSize:28,fontWeight:900,color:t.text,marginBottom:20,fontFamily }}>Search</div>
      <div style={{ display:"flex",gap:10,marginBottom:24 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSearch()} placeholder="Artists, songs, albums..." style={{ flex:1,padding:"14px 18px",fontSize:16,fontWeight:600,background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,color:t.text,outline:"none",fontFamily }} />
        <div onClick={handleSearch} style={{ padding:"14px 20px",borderRadius:16,background:t.accent,color:t.accentText,fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          {isLoading ? <div style={{ width:20,height:20,border:`2px solid ${t.accentText}`,borderTopColor:"transparent",borderRadius:"50%",animation:"vinylSpin 0.8s linear infinite" }} /> : <ISearch c={t.accentText} s={20} />}
        </div>
      </div>
      {displayTracks.length === 0 ? (
        <div style={{ textAlign:"center",marginTop:60 }}>
          <ISearch c={t.textMuted} s={48} />
          <div style={{ fontSize:16,fontWeight:700,color:t.textMuted,marginTop:16 }}>Search for your favorite music</div>
        </div>
      ) : (
        displayTracks.map((tr: Track) => (
          <div key={tr.id} onClick={() => playTrack(tr.id)} style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16,cursor:"pointer" }}>
            <div style={{ width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0 }}><AlbumArt index={tr.artId} artUrl={tr.artUrl} /></div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:15,fontWeight:800,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2 }}>{tr.title}</div>
              <div style={{ fontSize:12,fontWeight:600,color:t.textSub }}>{tr.artist}</div>
            </div>
            <div style={{ fontSize:12,color:t.textMuted,fontWeight:600,flexShrink:0 }}>{tr.duration}</div>
          </div>
        ))
      )}
    </div>
  );
}

function LibraryScreen({ navigate, playTrack, t, tracks, fontFamily }: any) {
  const displayTracks: Track[] = tracks?.length > 0 ? tracks : mockTracks;
  return (
    <div className="hide-scrollbar" style={{ height:"100%",overflowY:"auto",padding:"50px 20px 80px" }}>
      <div style={{ fontSize:28,fontWeight:900,color:t.text,marginBottom:20,fontFamily }}>Library</div>
      {displayTracks.map((tr: Track) => (
        <div key={tr.id} onClick={() => playTrack(tr.id)} style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16,cursor:"pointer" }}>
          <div style={{ width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0 }}><AlbumArt index={tr.artId} artUrl={tr.artUrl} /></div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:15,fontWeight:800,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2 }}>{tr.title}</div>
            <div style={{ fontSize:12,fontWeight:600,color:t.textSub }}>{tr.artist}</div>
          </div>
          <div style={{ fontSize:12,color:t.textMuted,fontWeight:600 }}>{tr.duration}</div>
        </div>
      ))}
    </div>
  );
}

function NowPlayingScreen({ goBack, navigate, t, isPlaying, togglePlay, progress, track, audioRef, playNext, playPrev, fontFamily, liked, setLiked, shuffle, setShuffle, repeat, setRepeat }: any) {
  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const audio = audioRef?.current;
    if (audio && audio.duration) audio.currentTime = ratio * audio.duration;
  }, [audioRef]);

  const currentSec = audioRef?.current ? audioRef.current.currentTime : 0;
  const totalSec = track?.durationSec || 0;

  return (
    <div style={{ position:"relative",width:"100%",height:"100%",overflow:"hidden",background:t.bg }}>
      <div style={{ position:"absolute",inset:-50,zIndex:0,opacity:0.15,filter:"blur(40px)" }}><AlbumArt index={track?.artId||0} artUrl={track?.artUrl} /></div>
      <div style={{ position:"relative",zIndex:1,padding:"50px 20px 40px",display:"flex",flexDirection:"column",height:"100%",boxSizing:"border-box" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32 }}>
          <div onClick={goBack} style={{ width:40,height:40,borderRadius:20,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><IChevD c="white" /></div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.6)" }}>NOW PLAYING</div>
            <div style={{ fontSize:13,fontWeight:700,color:"white",marginTop:2,fontFamily }}>YVL</div>
          </div>
          <div onClick={() => navigate("lyrics")} style={{ width:40,height:40,borderRadius:20,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><ILyrics c="white" /></div>
        </div>
        {/* Vinyl */}
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:230,height:230,borderRadius:"50%",background:"#111",position:"relative",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",animation:isPlaying?"vinylSpin 8s linear infinite":"none" }}>
            {[1,2,3,4,5,6,7].map(i => <div key={i} style={{ position:"absolute",inset:10+i*10,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.04)" }}></div>)}
            <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:86,height:86,borderRadius:8,overflow:"hidden" }}><AlbumArt index={track?.artId||0} artUrl={track?.artUrl} /></div>
            <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:"white" }}></div>
          </div>
        </div>
        {/* Info + like */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:24,fontWeight:900,color:"white",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily }}>{track?.title}</div>
            <div style={{ fontSize:16,color:"rgba(255,255,255,0.7)",fontWeight:600 }}>{track?.artist}</div>
          </div>
          <div onClick={() => setLiked(!liked)} style={{ cursor:"pointer",padding:8 }}><IHeart c={liked?"#ff4d6d":"rgba(255,255,255,0.7)"} s={28} filled={liked} /></div>
        </div>
        {/* Progress bar */}
        <div style={{ marginBottom:24 }}>
          <div onClick={seekTo} style={{ height:6,background:"rgba(255,255,255,0.2)",borderRadius:3,position:"relative",cursor:"pointer" }}>
            <div style={{ position:"absolute",left:0,top:0,bottom:0,width:`${progress}%`,background:"white",borderRadius:3,transition:"width 0.1s linear" }}></div>
            <div style={{ position:"absolute",left:`${progress}%`,top:"50%",transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.4)",pointerEvents:"none" }}></div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600,marginTop:8 }}>
            <span>{fmtTime(currentSec)}</span>
            <span>{track?.duration || "0:00"}</span>
          </div>
        </div>
        {/* Controls */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 8px" }}>
          <div onClick={() => setShuffle(!shuffle)} style={{ cursor:"pointer",opacity:shuffle?1:0.4 }}><IShuffle c="white" s={22} /></div>
          <div style={{ display:"flex",alignItems:"center",gap:20 }}>
            <div onClick={playPrev} style={{ cursor:"pointer" }}><IPrev c="white" s={30} /></div>
            <div onClick={togglePlay} style={{ width:72,height:72,borderRadius:36,background:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 8px 24px rgba(255,255,255,0.3)",flexShrink:0 }}>
              {isPlaying ? <IPause c="black" s={28} filled /> : <IPlay c="black" s={28} filled />}
            </div>
            <div onClick={playNext} style={{ cursor:"pointer" }}><INext c="white" s={30} /></div>
          </div>
          <div onClick={() => setRepeat(!repeat)} style={{ cursor:"pointer",opacity:repeat?1:0.4 }}><IRepeat c="white" s={22} /></div>
        </div>
      </div>
    </div>
  );
}

function LyricsScreen({ goBack, navigate, t, isPlaying, togglePlay, progress, track, syncedLyrics, audioRef, fontFamily, playNext, playPrev }: any) {
  const [lyricsMode, setLyricsMode] = useState<"line"|"word"|"karaoke"|"bubble"|"flow">("line");
  const [currentIdx, setCurrentIdx] = useState(0);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLyrics: LyricsLine[] = syncedLyrics?.length > 0 ? syncedLyrics : mockSyncedLyrics;
  const activeLyricsText = activeLyrics.map(l => l.text);

  // ── Real-time lyrics sync with audio.currentTime ──
  useEffect(() => {
    const interval = setInterval(() => {
      const audio = audioRef?.current;
      if (!audio || !activeLyrics.length) return;
      const ct = audio.currentTime;
      let idx = 0;
      for (let i = 0; i < activeLyrics.length; i++) {
        if (activeLyrics[i].time <= ct) idx = i; else break;
      }
      if (idx !== currentIdx) setCurrentIdx(idx);
    }, 80);
    return () => clearInterval(interval);
  }, [activeLyrics, currentIdx, audioRef]);

  // Auto-scroll current line into view
  useEffect(() => {
    const el = lineRefs.current[currentIdx];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIdx]);

  // Word mode: track by word timing (distribute words across lines evenly)
  const [activeWord, setActiveWord] = useState(0);
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio || lyricsMode !== "word") return;
    const allWords = activeLyricsText.join(" ").split(" ");
    const interval = setInterval(() => {
      const ct = audio.currentTime;
      const totalDur = audio.duration || activeLyrics[activeLyrics.length-1]?.time + 3 || 60;
      const wordIdx = Math.floor((ct / totalDur) * allWords.length);
      setActiveWord(Math.min(wordIdx, allWords.length - 1));
    }, 80);
    return () => clearInterval(interval);
  }, [activeLyrics, activeLyricsText, lyricsMode, audioRef]);

  const allWords = activeLyricsText.join(" ").split(" ");
  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const audio = audioRef?.current;
    if (audio && audio.duration) audio.currentTime = ratio * audio.duration;
  }, [audioRef]);

  const modes: Array<{ id: typeof lyricsMode; label: string }> = [
    { id: "line", label: "Line" }, { id: "word", label: "Word" },
    { id: "karaoke", label: "Karaoke" }, { id: "bubble", label: "Bubble" }, { id: "flow", label: "Flow" },
  ];

  return (
    <div style={{ position:"relative",width:"100%",height:"100%",overflow:"hidden",background:"#080808",display:"flex",flexDirection:"column" }}>
      {/* Blurred art bg */}
      <div style={{ position:"absolute",inset:-60,zIndex:0,opacity:0.18,filter:"blur(60px)",transform:"scale(1.2)" }}><AlbumArt index={track?.artId||0} artUrl={track?.artUrl} /></div>
      <div style={{ position:"relative",zIndex:1,padding:"52px 24px 0",boxSizing:"border-box" }}>
        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div onClick={goBack} style={{ width:40,height:40,borderRadius:20,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><IChevD c="white" /></div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.5)" }}>LYRICS</div>
            <div style={{ fontSize:14,fontWeight:800,color:"white",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180,fontFamily }}>{track?.title}</div>
          </div>
          <div onClick={() => navigate("nowplaying")} style={{ width:40,height:40,borderRadius:20,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><IMenu c="white" /></div>
        </div>
        {/* Mode switcher */}
        <div className="hide-scrollbar" style={{ display:"flex",gap:8,overflowX:"auto",marginBottom:12 }}>
          {modes.map(m => (
            <div key={m.id} onClick={() => setLyricsMode(m.id)} style={{ flexShrink:0,padding:"8px 14px",borderRadius:20,background:lyricsMode===m.id?"rgba(255,255,255,0.18)":"transparent",color:lyricsMode===m.id?"white":"rgba(255,255,255,0.4)",fontSize:13,fontWeight:800,cursor:"pointer",border:lyricsMode===m.id?"1px solid rgba(255,255,255,0.25)":"1px solid transparent",transition:"all 0.2s" }}>{m.label}</div>
          ))}
        </div>
      </div>

      {/* Lyrics content — constrained height, no overflow into controls */}
      <div ref={containerRef} className="hide-scrollbar" style={{ position:"relative",zIndex:1,flex:1,overflowY:"auto",padding:"0 24px",minHeight:0 }}>
        {/* LINE MODE */}
        {lyricsMode === "line" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16,paddingTop:16,paddingBottom:24 }}>
            {activeLyrics.map((line, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;
              return (
                <div key={i} ref={el => { lineRefs.current[i] = el; }} onClick={() => { setCurrentIdx(i); const audio = audioRef?.current; if (audio) audio.currentTime = line.time; }} className={isActive ? "lyrics-line-active" : ""} style={{ fontSize:isActive?28:18, fontWeight:isActive?900:600, color:"white", opacity:isActive?1:isPast?0.2:0.4, lineHeight:1.3, cursor:"pointer", letterSpacing:isActive?-0.5:0, transition:"opacity 0.3s ease,font-size 0.3s ease", fontFamily }}>
                  {line.text}
                </div>
              );
            })}
          </div>
        )}

        {/* WORD MODE */}
        {lyricsMode === "word" && (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100%",gap:20,paddingTop:40 }}>
            <div style={{ fontSize:46,fontWeight:900,color:"white",textAlign:"center",lineHeight:1.1,letterSpacing:-1,transition:"all 0.2s ease",fontFamily }}>{allWords[activeWord]}</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:280 }}>
              {allWords.slice(Math.max(0,activeWord-3), activeWord+8).map((w, i) => {
                const rel = i - Math.min(3, activeWord);
                return <span key={i} style={{ fontSize:13,color:"white",opacity:rel===0?1:rel<0?0.2:0.4,fontWeight:rel===0?700:400,transition:"opacity 0.2s" }}>{w}</span>;
              })}
            </div>
          </div>
        )}

        {/* KARAOKE MODE */}
        {lyricsMode === "karaoke" && (
          <div style={{ display:"flex",flexDirection:"column",gap:20,paddingTop:16,paddingBottom:24 }}>
            {activeLyrics.map((line, li) => {
              const isActiveLine = li === currentIdx;
              const words = line.text.split(" ");
              const audio = audioRef?.current;
              const timeInLine = audio ? audio.currentTime - line.time : 0;
              const nextTime = activeLyrics[li+1]?.time ?? (line.time + 4);
              const lineDur = nextTime - line.time;
              const wordFrac = Math.max(0, Math.min(1, timeInLine / lineDur));
              const wordPos = Math.floor(wordFrac * words.length);
              return (
                <div key={li} ref={el => { lineRefs.current[li] = el; }} onClick={() => { setCurrentIdx(li); const a = audioRef?.current; if (a) a.currentTime = line.time; }} style={{ cursor:"pointer" }}>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:"0 6px" }}>
                    {words.map((w, wi) => {
                      const highlighted = isActiveLine && wi <= wordPos;
                      const isCurrent = isActiveLine && wi === wordPos;
                      return (
                        <span key={wi} style={{ fontSize:isActiveLine?24:16,fontWeight:isActiveLine?800:500,color:"white",opacity:highlighted?1:isActiveLine?0.4:0.2,borderBottom:isCurrent?"2px solid white":"2px solid transparent",transition:"all 0.15s ease",lineHeight:1.5,fontFamily }}>{w}</span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BUBBLE MODE — fully contained, no overflow */}
        {lyricsMode === "bubble" && (
          <div style={{ paddingTop:16,paddingBottom:24 }}>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,alignContent:"flex-start",justifyContent:"center" }}>
              {allWords.slice(0, 50).map((word, i) => {
                const isActive = Math.floor((currentIdx / activeLyrics.length) * allWords.length) === i;
                return (
                  <div key={i} style={{ padding:"8px 14px",borderRadius:24,background:isActive?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.07)",border:`1px solid ${isActive?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.1)"}`,fontSize:isActive?16:13,fontWeight:isActive?900:600,color:"white",opacity:isActive?1:0.5,transition:"all 0.3s ease",animation:isActive?"bubbleFloat 1.2s ease-in-out infinite":"none",cursor:"default",fontFamily }}>
                    {word}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FLOW MODE */}
        {lyricsMode === "flow" && (
          <div style={{ display:"flex",flexDirection:"column",gap:28,paddingTop:16,paddingBottom:24 }}>
            {activeLyrics.map((line, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;
              const audio = audioRef?.current;
              const timeInLine = audio ? audio.currentTime - line.time : 0;
              const nextTime = activeLyrics[i+1]?.time ?? (line.time + 4);
              const lineDur = nextTime - line.time;
              const fillPct = isActive ? Math.min(100, (timeInLine / lineDur) * 100) : isPast ? 100 : 0;
              return (
                <div key={i} ref={el => { lineRefs.current[i] = el; }} onClick={() => { setCurrentIdx(i); const a = audioRef?.current; if (a) a.currentTime = line.time; }} style={{ cursor:"pointer",position:"relative" }}>
                  <div style={{ position:"absolute",left:0,top:0,bottom:0,width:`${fillPct}%`,background:"rgba(255,255,255,0.08)",borderRadius:8,transition:"width 0.1s linear",pointerEvents:"none" }} />
                  <div style={{ padding:"12px 16px",fontSize:isActive?22:16,fontWeight:isActive?900:600,color:"white",opacity:isActive?1:isPast?0.25:0.45,lineHeight:1.3,transition:"all 0.3s",animation:isActive?"flowReveal 0.3s ease":undefined,fontFamily }}>{line.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini player controls — fixed at bottom */}
      <div style={{ position:"relative",zIndex:2,padding:"12px 24px 20px",background:"rgba(8,8,8,0.95)",borderTop:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(20px)" }}>
        <div onClick={seekTo} style={{ height:3,background:"rgba(255,255,255,0.15)",borderRadius:2,cursor:"pointer",marginBottom:12,position:"relative" }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:`${progress}%`,background:"white",borderRadius:2 }}></div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:40,height:40,borderRadius:10,overflow:"hidden",flexShrink:0 }}><AlbumArt index={track?.artId||0} artUrl={track?.artUrl} /></div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:800,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily }}>{track?.title}</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600 }}>{track?.artist}</div>
          </div>
          <div onClick={playPrev} style={{ cursor:"pointer",padding:4 }}><IPrev c="white" s={20} /></div>
          <div onClick={togglePlay} style={{ width:44,height:44,borderRadius:22,background:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
            {isPlaying ? <IPause c="black" s={20} filled /> : <IPlay c="black" s={20} filled />}
          </div>
          <div onClick={playNext} style={{ cursor:"pointer",padding:4 }}><INext c="white" s={20} /></div>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ goBack, t, themeName, setThemeName, fontStyle, setFontStyle, customFontUrl, setCustomFontUrl, fontFamily }: any) {
  const [normalizeVol, setNormalizeVol] = useState(true);
  const [gapless, setGapless] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [audioQuality, setAudioQuality] = useState<"Standard"|"High"|"Very High">("High");
  const [showEq, setShowEq] = useState(false);
  const [eqBands, setEqBands] = useState([0, 2, -1, 3, 1]);
  const [showCacheCleared, setShowCacheCleared] = useState(false);
  const [fontUrlInput, setFontUrlInput] = useState(customFontUrl || "");
  const [fontPreview, setFontPreview] = useState("");
  const [showFontImport, setShowFontImport] = useState(false);

  const applyCustomFont = () => {
    if (!fontUrlInput.trim()) return;
    let url = fontUrlInput.trim();
    if (url.includes("fonts.googleapis.com")) {
      const existing = document.querySelector("link[data-custom-font]");
      if (existing) existing.remove();
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = url;
      link.setAttribute("data-custom-font", "true");
      document.head.appendChild(link);
      const famMatch = url.match(/family=([^&:+]+)/);
      const famName = famMatch ? decodeURIComponent(famMatch[1].replace(/\+/g, " ")) : "Custom";
      setFontPreview(famName);
      setCustomFontUrl(`'${famName}', sans-serif`);
      setFontStyle("custom");
    }
  };

  const Section = ({ title, children }: any) => (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontSize:12,fontWeight:800,color:t.textSub,letterSpacing:1.5,marginBottom:8,marginLeft:4,textTransform:"uppercase" }}>{title}</div>
      <div style={{ background:t.surface,borderRadius:18,overflow:"hidden",border:`1px solid ${t.border}` }}>{children}</div>
    </div>
  );
  const Toggle = ({ on, toggle }: any) => (
    <div onClick={toggle} style={{ width:48,height:28,borderRadius:14,background:on?t.accent:t.surfaceAlt,position:"relative",cursor:"pointer",transition:"background 0.25s",border:`1px solid ${on?"transparent":t.border}`,flexShrink:0 }}>
      <div style={{ position:"absolute",top:3,left:on?22:3,width:22,height:22,borderRadius:"50%",background:"white",transition:"left 0.25s",boxShadow:"0 2px 6px rgba(0,0,0,0.25)" }} />
    </div>
  );
  const Item = ({ label, right, last=false, onClick }: any) => (
    <div onClick={onClick} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"15px 16px",borderBottom:last?"none":`1px solid ${t.border}`,cursor:"pointer" }}>
      <div style={{ fontSize:16,color:t.text,fontWeight:700,fontFamily }}>{label}</div>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>{right}</div>
    </div>
  );
  const ThemeCard = ({ id, name, bg, animated }: any) => {
    const active = themeName === id;
    return (
      <div onClick={() => setThemeName(id)} style={{ cursor:"pointer",display:"flex",flexDirection:"column",gap:6,alignItems:"center" }}>
        <div style={{ width:"100%",height:64,borderRadius:14,background:bg,border:active?`2.5px solid ${t.accent}`:`1.5px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",transition:"border 0.2s" }}>
          {animated && <div style={{ position:"absolute",inset:0,opacity:0.4,animation:"pulse 2s ease infinite" }} />}
          {active && <div style={{ width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.9)",display:"flex",alignItems:"center",justifyContent:"center" }}><ICheck c="#000" s={14} /></div>}
        </div>
        <div style={{ fontSize:11,fontWeight:800,color:active?t.text:t.textSub,textAlign:"center" }}>{name}</div>
      </div>
    );
  };

  return (
    <div className="hide-scrollbar" style={{ padding:"50px 0 60px",overflowY:"auto",height:"100%",boxSizing:"border-box" }}>
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:28,padding:"0 20px" }}>
        <div onClick={goBack} style={{ cursor:"pointer",width:36,height:36,borderRadius:"50%",background:t.surface,display:"flex",alignItems:"center",justifyContent:"center" }}><IChevL c={t.text} s={20} /></div>
        <div style={{ fontSize:30,fontWeight:900,color:t.text,letterSpacing:-1,fontFamily }}>Settings</div>
      </div>
      <div style={{ padding:"0 16px" }}>
        <Section title="THEMES">
          <div style={{ padding:"16px" }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
              <ThemeCard id="dark" name="Dark" bg="#0d0d0d" />
              <ThemeCard id="sky" name="Sky" bg="linear-gradient(135deg,#4ab3f4,#d4effe)" />
              <ThemeCard id="light" name="Light" bg="#f5f5f5" />
              <ThemeCard id="sunset" name="Sunset" bg="linear-gradient(135deg,#3a0a10,#5a1a08)" />
              <ThemeCard id="neon" name="Neon" bg="linear-gradient(135deg,#050010,#ff008033,#00ffff22)" animated />
              <ThemeCard id="ocean" name="Ocean" bg="linear-gradient(135deg,#000d1a,#0066aa,#00d4ff33)" animated />
            </div>
          </div>
        </Section>
        <Section title="FONT STYLE">
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {(["bold","classic","modern","rounded","retro"] as FontStyleType[]).map(f => {
                const active = fontStyle === f;
                return (
                  <div key={f} onClick={() => setFontStyle(f)} style={{ flex:1,minWidth:52,height:60,borderRadius:14,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:active?t.accent:t.surfaceAlt,border:active?"2px solid transparent":`1.5px solid ${t.border}`,transition:"all 0.2s" }}>
                    <span style={{ fontSize:20,fontWeight:900,lineHeight:1,color:active?t.accentText:t.text,fontFamily:fontStyleMap[f].family }}>Aa</span>
                    <span style={{ fontSize:10,fontWeight:800,color:active?t.accentText:t.textSub }}>{fontStyleMap[f].label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
        {/* CUSTOM FONT IMPORT */}
        <Section title="IMPORT FONT">
          <div style={{ padding:"16px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:t.textSub,marginBottom:10 }}>Paste a Google Fonts URL to use a custom font in YVL Music.</div>
            <div style={{ fontSize:11,color:t.textMuted,marginBottom:12,fontFamily:"monospace",background:t.surfaceAlt,padding:"8px 10px",borderRadius:10,overflowX:"auto",whiteSpace:"nowrap" }}>https://fonts.googleapis.com/css2?family=Poppins:wght@700;900&display=swap</div>
            <input value={fontUrlInput} onChange={e => setFontUrlInput(e.target.value)} placeholder="https://fonts.googleapis.com/css2?family=..." style={{ width:"100%",padding:"12px 14px",fontSize:13,fontWeight:600,background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:14,color:t.text,outline:"none",boxSizing:"border-box",fontFamily:"monospace",marginBottom:10 }} />
            {fontPreview && <div style={{ fontSize:14,fontWeight:700,color:t.accent,marginBottom:8 }}>✓ Loaded: <span style={{ fontFamily:`'${fontPreview}',sans-serif` }}>{fontPreview} — AaBbCc 123</span></div>}
            <div onClick={applyCustomFont} style={{ padding:"12px",textAlign:"center",borderRadius:14,background:fontUrlInput.includes("fonts.googleapis.com")?t.accent:t.surfaceAlt,color:fontUrlInput.includes("fonts.googleapis.com")?t.accentText:t.textMuted,fontWeight:800,fontSize:14,cursor:"pointer" }}>Apply Font</div>
            {fontStyle === "custom" && <div onClick={() => { setFontStyle("bold"); setCustomFontUrl(""); setFontPreview(""); setFontUrlInput(""); }} style={{ padding:"10px",textAlign:"center",color:t.textMuted,fontSize:12,fontWeight:700,cursor:"pointer",marginTop:6 }}>Reset to Default</div>}
          </div>
        </Section>
        <Section title="PLAYBACK">
          <Item label="Audio Quality" right={<><span style={{ fontSize:14,fontWeight:800,color:t.accent }}>{audioQuality}</span><IChevR c={t.textMuted} s={16} /></>} onClick={() => setAudioQuality(q => q==="Standard"?"High":q==="High"?"Very High":"Standard")} />
          {showEq ? (
            <div style={{ padding:"16px 16px 8px" }}>
              <div style={{ fontSize:14,fontWeight:800,color:t.text,marginBottom:12,fontFamily }}>Equalizer</div>
              <div style={{ display:"flex",gap:12,alignItems:"flex-end",justifyContent:"center",height:80 }}>
                {["60Hz","250Hz","1kHz","4kHz","16kHz"].map((band, bi) => (
                  <div key={band} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                    <div onClick={() => setEqBands(b => { const n=[...b]; n[bi]=(n[bi]+2>6)?-6:n[bi]+2; return n; })} style={{ width:28,borderRadius:4,background:t.accent,cursor:"pointer",transition:"height 0.2s",height:`${28+eqBands[bi]*4}px`,minHeight:8 }} />
                    <span style={{ fontSize:9,fontWeight:700,color:t.textMuted }}>{band}</span>
                  </div>
                ))}
              </div>
              <div onClick={() => setShowEq(false)} style={{ textAlign:"center",fontSize:12,fontWeight:800,color:t.accent,marginTop:10,cursor:"pointer" }}>CLOSE</div>
            </div>
          ) : (
            <Item label="Equalizer" right={<><span style={{ fontSize:14,fontWeight:700,color:t.textSub }}>Custom</span><IChevR c={t.textMuted} s={16} /></>} onClick={() => setShowEq(true)} />
          )}
          <Item label="Normalize Volume" right={<Toggle on={normalizeVol} toggle={() => setNormalizeVol(v=>!v)} />} />
          <Item label="Gapless Playback" last right={<Toggle on={gapless} toggle={() => setGapless(v=>!v)} />} />
        </Section>
        <Section title="DOWNLOADS">
          <Item label="Auto-Download on WiFi" right={<Toggle on={autoDownload} toggle={() => setAutoDownload(v=>!v)} />} />
          <Item label={showCacheCleared?"✓ Cache Cleared":"Clear Cache"} last right={showCacheCleared?<ICheck c={t.accent} s={18} />:<IChevR c={t.textMuted} s={16} />} onClick={() => { setShowCacheCleared(true); setTimeout(()=>setShowCacheCleared(false),2500); }} />
        </Section>
        <div style={{ background:t.surface,borderRadius:20,padding:"24px 20px",border:`1px solid ${t.border}`,textAlign:"center",marginBottom:20 }}>
          <div style={{ fontSize:40,fontWeight:900,color:t.text,letterSpacing:-3,lineHeight:1,fontFamily }}>YVL</div>
          <div style={{ fontSize:10,letterSpacing:5,color:t.textSub,fontWeight:800,marginTop:3,marginBottom:14 }}>MUSIC</div>
          <div style={{ width:40,height:2.5,background:"#dc143c",borderRadius:2,margin:"0 auto 14px" }} />
          <div style={{ fontSize:15,fontWeight:800,color:t.text }}>Made by W Shourya</div>
          <div style={{ fontSize:12,fontWeight:700,color:t.textMuted,marginTop:4 }}>v3.0.0</div>
        </div>
      </div>
    </div>
  );
}

// Bottom nav
function BottomNav({ screen, navigate, t, fontFamily }: any) {
  const tabs = [
    { id:"home", label:"Home", Icon: IHome },
    { id:"search", label:"Search", Icon: ISearch },
    { id:"lyrics", label:"Lyrics", Icon: ILyrics },
    { id:"library", label:"Library", Icon: ILibrary },
    { id:"settings", label:"Settings", Icon: ISettings2 },
  ];
  const mainTabs = ["home","search","library","settings"];
  const visible = mainTabs.includes(screen) || screen === "search";
  if (!visible) return null;
  return (
    <div style={{ position:"absolute",bottom:0,left:0,right:0,background:t.navBg,borderTop:`1px solid ${t.border}`,display:"flex",padding:"8px 0 12px",zIndex:50,backdropFilter:"blur(20px)" }}>
      {tabs.filter(tab => tab.id !== "lyrics").map(({ id, label, Icon }) => {
        const active = screen === id;
        return (
          <div key={id} onClick={() => navigate(id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",padding:"4px 0" }}>
            <Icon c={active ? t.accent : t.textMuted} s={24} />
            <span style={{ fontSize:11,fontWeight:active?800:600,color:active?t.accent:t.textMuted,fontFamily }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Mini player bar
function MiniPlayer({ track, isPlaying, togglePlay, navigate, t, fontFamily }: any) {
  if (!track) return null;
  return (
    <div onClick={() => navigate("nowplaying")} style={{ position:"absolute",bottom:60,left:12,right:12,background:t.isDark?"rgba(30,30,35,0.97)":"rgba(255,255,255,0.97)",borderRadius:18,padding:"10px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:`1px solid ${t.border}`,backdropFilter:"blur(20px)",boxShadow:"0 8px 32px rgba(0,0,0,0.35)",zIndex:40 }}>
      <div style={{ width:42,height:42,borderRadius:10,overflow:"hidden",flexShrink:0 }}><AlbumArt index={track.artId} artUrl={track.artUrl} /></div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:14,fontWeight:800,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily }}>{track.title}</div>
        <div style={{ fontSize:12,color:t.textSub,fontWeight:600 }}>{track.artist}</div>
      </div>
      <div onClick={e => { e.stopPropagation(); togglePlay(); }} style={{ width:38,height:38,borderRadius:19,background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
        {isPlaying ? <IPause c={t.accentText} s={18} filled /> : <IPlay c={t.accentText} s={18} filled />}
      </div>
    </div>
  );
}

export function FullApp() {
  const [userName, setUserName] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [screenHistory, setScreenHistory] = useState<string[]>(["home"]);
  const screen = screenHistory[screenHistory.length - 1];

  const [themeName, setThemeName] = useState<ThemeType>("dark");
  const t = getTheme(themeName);
  const [fontStyle, setFontStyle] = useState<FontStyleType>("bold");
  const [customFontUrl, setCustomFontUrl] = useState("");
  const fontFamily = fontStyle === "custom" && customFontUrl ? customFontUrl : (fontStyleMap[fontStyle]?.family || fontStyleMap.bold.family);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState(1);
  const [progress, setProgress] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(mockTracks);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricsLine[]>(mockSyncedLyrics);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = tracks.find(tr => tr.id === activeTrackId) || tracks[0] || mockTracks[0];

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    fetchSaavnSearch("top hits bollywood 2024").then(fetched => {
      if (fetched.length > 0) { setTracks(fetched); setActiveTrackId(fetched[0].id); }
      setIsLoadingTracks(false);
    });
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  useEffect(() => {
    if (!showSplash && userName) {
      const timer = setTimeout(() => setShowNotifModal(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showSplash, userName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = tracks.find(tr => tr.id === activeTrackId) || tracks[0];
    if (!track) return;
    if (track.previewUrl) {
      audio.src = track.previewUrl;
      audio.load();
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    }
    fetchSyncedLyrics(track.title, track.artist).then(lines => {
      setSyncedLyrics(lines.length > 0 ? lines : mockSyncedLyrics);
    });
    const onTimeUpdate = () => {
      if (audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play().catch(()=>{}); return; }
      const list = tracks;
      const idx = list.findIndex(tr => tr.id === activeTrackId);
      const nextIdx = shuffle ? Math.floor(Math.random() * list.length) : (idx + 1) % list.length;
      const next = list[nextIdx];
      if (next) { setActiveTrackId(next.id); setProgress(0); setLiked(false); }
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => { audio.removeEventListener("timeupdate", onTimeUpdate); audio.removeEventListener("ended", onEnded); };
  }, [activeTrackId, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying]);

  const navigate = (newScreen: string) => {
    if (screen === newScreen) return;
    setScreenHistory(prev => [...prev, newScreen]);
  };
  const goBack = () => setScreenHistory(prev => prev.length > 1 ? prev.slice(0,-1) : prev);

  const togglePlay = () => setIsPlaying(p => !p);

  const playTrack = (id: number) => {
    if (id === activeTrackId) { togglePlay(); return; }
    setActiveTrackId(id); setProgress(0); setIsPlaying(true); setLiked(false);
    navigate("nowplaying");
  };

  const playNext = () => {
    const list = tracks;
    const idx = list.findIndex(tr => tr.id === activeTrackId);
    const nextIdx = shuffle ? Math.floor(Math.random() * list.length) : (idx + 1) % list.length;
    const next = list[nextIdx];
    if (next) { setActiveTrackId(next.id); setProgress(0); setIsPlaying(true); setLiked(false); }
  };

  const playPrev = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    const list = tracks;
    const idx = list.findIndex(tr => tr.id === activeTrackId);
    const prevIdx = (idx - 1 + list.length) % list.length;
    const prev = list[prevIdx];
    if (prev) { setActiveTrackId(prev.id); setProgress(0); setIsPlaying(true); setLiked(false); }
  };

  const handleSearch = async (q: string) => {
    setIsSearching(true);
    const results = await fetchSaavnSearch(q);
    setSearchResults(results.length > 0 ? results : []);
    if (results.length > 0) setTracks(results);
    setIsSearching(false);
  };

  const mainTabs = ["home","search","library","settings"];
  const showMiniPlayer = mainTabs.includes(screen) && activeTrack;
  const showNav = mainTabs.includes(screen);

  if (showSplash) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#1a1a1a" }}>
        <GlobalStyles />
        <SplashScreen nameInput={nameInput} setNameInput={setNameInput} onEnter={() => { if (nameInput.trim()) { setUserName(nameInput.trim()); setShowSplash(false); } }} fontFamily={fontFamily} />
      </div>
    );
  }

  const renderScreen = () => {
    const commonProps = { navigate, goBack, t, isPlaying, togglePlay, progress, track: activeTrack, tracks, fontFamily, playNext, playPrev };
    switch (screen) {
      case "home":       return <HomeScreen {...commonProps} playTrack={playTrack} activeTrackId={activeTrackId} />;
      case "search":     return <SearchScreen {...commonProps} playTrack={playTrack} onSearch={handleSearch} isLoading={isSearching} tracks={searchResults.length > 0 ? searchResults : tracks} />;
      case "library":    return <LibraryScreen {...commonProps} playTrack={playTrack} />;
      case "nowplaying": return <NowPlayingScreen {...commonProps} audioRef={audioRef} liked={liked} setLiked={setLiked} shuffle={shuffle} setShuffle={setShuffle} repeat={repeat} setRepeat={setRepeat} />;
      case "lyrics":     return <LyricsScreen {...commonProps} syncedLyrics={syncedLyrics} audioRef={audioRef} />;
      case "settings":   return <SettingsScreen goBack={goBack} t={t} themeName={themeName} setThemeName={setThemeName} fontStyle={fontStyle} setFontStyle={setFontStyle} customFontUrl={customFontUrl} setCustomFontUrl={setCustomFontUrl} fontFamily={fontFamily} />;
      default:           return <HomeScreen {...commonProps} playTrack={playTrack} activeTrackId={activeTrackId} />;
    }
  };

  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#1a1a1a" }}>
      <GlobalStyles />
      <div style={{ width:375,height:812,borderRadius:40,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",position:"relative",fontFamily,background:typeof t.bg === "string" && t.bg.startsWith("linear") ? undefined : t.bg }}>
        {typeof t.bg === "string" && t.bg.startsWith("linear") && (
          <div style={{ position:"absolute",inset:0,background:t.bg,zIndex:0 }} />
        )}
        {/* Sky theme animated clouds */}
        {themeName === "sky" && (
          <div style={{ position:"absolute",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none" }}>
            <div style={{ position:"absolute",top:20,width:"200%",animation:"cloudDrift 20s linear infinite",opacity:0.4 }}>
              <svg width="800" height="80" viewBox="0 0 800 80" fill="white"><ellipse cx="100" cy="50" rx="80" ry="30"/><ellipse cx="130" cy="40" rx="60" ry="28"/><ellipse cx="80" cy="45" rx="50" ry="25"/><ellipse cx="400" cy="55" rx="100" ry="32"/><ellipse cx="440" cy="42" rx="70" ry="28"/><ellipse cx="600" cy="50" rx="80" ry="28"/></svg>
            </div>
          </div>
        )}
        {/* Neon glow */}
        {themeName === "neon" && (
          <div style={{ position:"absolute",inset:0,zIndex:0,pointerEvents:"none" }}>
            <div style={{ position:"absolute",top:"20%",left:"10%",width:200,height:200,borderRadius:"50%",background:"#ff0080",opacity:0.15,filter:"blur(80px)",animation:"neonPulse 4s ease infinite" }} />
            <div style={{ position:"absolute",bottom:"20%",right:"10%",width:200,height:200,borderRadius:"50%",background:"#00ffff",opacity:0.12,filter:"blur(80px)",animation:"neonPulse 4s ease infinite 2s" }} />
          </div>
        )}
        {/* Ocean waves */}
        {themeName === "ocean" && (
          <div style={{ position:"absolute",bottom:0,left:0,right:0,zIndex:0,pointerEvents:"none",height:120,overflow:"hidden",opacity:0.3 }}>
            <div style={{ position:"absolute",bottom:0,left:"-50%",width:"200%",animation:"oceanWave 6s ease-in-out infinite" }}>
              <svg viewBox="0 0 1200 120" fill="#00d4ff" xmlns="http://www.w3.org/2000/svg"><path d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z"/></svg>
            </div>
          </div>
        )}
        <div style={{ position:"relative",zIndex:1,height:"100%" }}>
          {renderScreen()}
          {showNav && <BottomNav screen={screen} navigate={navigate} t={t} fontFamily={fontFamily} />}
          {showMiniPlayer && <MiniPlayer track={activeTrack} isPlaying={isPlaying} togglePlay={togglePlay} navigate={navigate} t={t} fontFamily={fontFamily} />}
          {showNotifModal && <NotifModal onAllow={() => setShowNotifModal(false)} onDeny={() => setShowNotifModal(false)} t={t} />}
        </div>
      </div>
    </div>
  );
}

export default FullApp;
