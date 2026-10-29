/**
 * Platform icon SVG components for streaming, reading, and music platforms.
 * All icons are rendered inline as SVG for accessibility and no external dependency.
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// ─── Streaming Platforms ───────────────────────────────────────────────────────

export function NetflixIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Netflix">
      <rect width="24" height="24" rx="4" fill="#E50914"/>
      <path d="M7 4h2.5l5 16H12L7 4z" fill="white"/>
      <path d="M14.5 4H17L12 20H9.5l5-16z" fill="white"/>
      <path d="M7 4h2.5v16H7V4z" fill="white"/>
      <path d="M14.5 4H17v16h-2.5V4z" fill="white"/>
    </svg>
  );
}

export function PrimeVideoIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Prime Video">
      <rect width="24" height="24" rx="4" fill="#00A8E1"/>
      <path d="M5 9l7 6 7-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 16h18" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function DisneyPlusIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Disney+">
      <rect width="24" height="24" rx="4" fill="#0F3061"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="serif">D+</text>
    </svg>
  );
}

export function HuluIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Hulu">
      <rect width="24" height="24" rx="4" fill="#1CE783"/>
      <path d="M8 6v12M8 12h8M16 6v12" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function MaxIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Max">
      <rect width="24" height="24" rx="4" fill="#002BE7"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="sans-serif">MAX</text>
    </svg>
  );
}

export function AppleTVIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apple TV+">
      <rect width="24" height="24" rx="4" fill="#000"/>
      <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="600" fontFamily="sans-serif">Apple</text>
      <text x="12" y="18" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="sans-serif">TV+</text>
    </svg>
  );
}

export function SpotifyIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Spotify">
      <circle cx="12" cy="12" r="12" fill="#1DB954"/>
      <path d="M17 9.5c-3-1.8-8-2-10.8-.8-.5.2-.8.7-.6 1.2.2.5.7.8 1.2.6C9.6 9.6 14 9.8 16.5 11.4c.4.2 1 .1 1.2-.4.2-.4.1-1-.4-1.2z" fill="white"/>
      <path d="M16.8 12.6c-2.6-1.6-6.8-2-9.9-.9-.4.1-.6.5-.5.9.1.4.5.6.9.5C10 12.2 13.8 12.6 16 14c.4.2.8.1 1-.3.2-.4.1-.9-.3-1.1z" fill="white"/>
      <path d="M16 15.5c-2.2-1.3-5.7-1.6-8.3-.8-.4.1-.6.5-.5.8.1.4.5.5.8.5C10.4 15.2 13.5 15.5 15.5 16.7c.3.2.7.1.9-.2.2-.3.1-.7-.2-.9z" fill="white"/>
    </svg>
  );
}

export function AppleMusicIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apple Music">
      <rect width="24" height="24" rx="6" fill="url(#am-grad)"/>
      <defs>
        <linearGradient id="am-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FC5C7D"/>
          <stop offset="100%" stopColor="#6A3093"/>
        </linearGradient>
      </defs>
      <path d="M9 6v9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2l.1-.1V9.2L16 7.5v7.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2l.1-.1V8L9 6z" fill="white"/>
    </svg>
  );
}

export function YouTubeMusicIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="YouTube Music">
      <rect width="24" height="24" rx="4" fill="#FF0000"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="#FF0000"/>
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function DeezerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Deezer">
      <rect width="24" height="24" rx="4" fill="#A238FF"/>
      <rect x="3" y="15" width="3" height="6" rx="1" fill="white"/>
      <rect x="7" y="11" width="3" height="10" rx="1" fill="white"/>
      <rect x="11" y="7" width="3" height="14" rx="1" fill="white"/>
      <rect x="15" y="3" width="3" height="18" rx="1" fill="white"/>
      <rect x="19" y="7" width="2" height="14" rx="1" fill="white"/>
    </svg>
  );
}

export function YouTubeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="YouTube">
      <rect width="24" height="24" rx="4" fill="#FF0000"/>
      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="white"/>
    </svg>
  );
}

// ─── Book Platforms ────────────────────────────────────────────────────────────

export function KindleIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Kindle">
      <rect width="24" height="24" rx="4" fill="#FF9900"/>
      <path d="M8 4v16M12 12l4-8v16l-4-8z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function LibbyIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Libby">
      <rect width="24" height="24" rx="12" fill="#2A9D8F"/>
      <path d="M12 6c-1.7 0-3 1.3-3 3 0 1.1.6 2.1 1.5 2.6L9 18h6l-1.5-6.4c.9-.5 1.5-1.5 1.5-2.6 0-1.7-1.3-3-3-3z" fill="white"/>
    </svg>
  );
}

export function BookshopIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Bookshop.org">
      <rect width="24" height="24" rx="4" fill="#2F4F4F"/>
      <rect x="5" y="5" width="5" height="14" rx="1" fill="#E8C97E"/>
      <rect x="11" y="7" width="4" height="12" rx="1" fill="#F5E6B2"/>
      <rect x="16" y="4" width="3" height="16" rx="1" fill="#C9A74A"/>
    </svg>
  );
}

export function OpenLibraryIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Open Library">
      <rect width="24" height="24" rx="4" fill="#CC3300"/>
      <path d="M12 5C8 5 5 9 5 12s3 7 7 7 7-3 7-7-3-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>
  );
}

// ─── TMDB Logo (required attribution) ─────────────────────────────────────────

export function TmdbLogoIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size * 3} height={size} viewBox="0 0 273 35" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="TMDB Logo">
      <rect width="273" height="35" rx="4" fill="#0D253F"/>
      <text x="136" y="25" textAnchor="middle" fill="#01B4E4" fontSize="18" fontWeight="700" fontFamily="sans-serif">TMDB</text>
    </svg>
  );
}

// ─── Generic platform icon (fallback) ────────────────────────────────────────

export function GenericPlatformIcon({ name, className, size = 24 }: IconProps & { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={name}>
      <rect width="24" height="24" rx="4" fill="#374151"/>
      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="sans-serif">{initial}</text>
    </svg>
  );
}

// ─── Icon resolver ────────────────────────────────────────────────────────────

/** Maps a platformId or provider name to the correct icon component */
export function getPlatformIcon(platformId: string, name: string, props: IconProps = {}) {
  const id = platformId.toLowerCase();
  const n = name.toLowerCase();

  if (id.includes('netflix') || n.includes('netflix')) return <NetflixIcon {...props} />;
  if (id.includes('prime') || n.includes('prime') || n.includes('amazon prime')) return <PrimeVideoIcon {...props} />;
  if (id.includes('disney') || n.includes('disney')) return <DisneyPlusIcon {...props} />;
  if (id.includes('hulu') || n.includes('hulu')) return <HuluIcon {...props} />;
  if (id === 'max' || id.includes('hbo') || n.includes('max') || n.includes('hbo')) return <MaxIcon {...props} />;
  if (id.includes('apple_tv') || n.includes('apple tv')) return <AppleTVIcon {...props} />;
  if (id.includes('spotify') || n.includes('spotify')) return <SpotifyIcon {...props} />;
  if (id.includes('apple_music') || n.includes('apple music')) return <AppleMusicIcon {...props} />;
  if (id.includes('youtube_music') || n.includes('youtube music')) return <YouTubeMusicIcon {...props} />;
  if (id.includes('youtube') || n.includes('youtube')) return <YouTubeIcon {...props} />;
  if (id.includes('deezer') || n.includes('deezer')) return <DeezerIcon {...props} />;
  if (id.includes('kindle') || n.includes('kindle') || n.includes('amazon video') || n.includes('amazon video')) return <KindleIcon {...props} />;
  if (id.includes('libby') || n.includes('libby')) return <LibbyIcon {...props} />;
  if (id.includes('bookshop') || n.includes('bookshop')) return <BookshopIcon {...props} />;
  if (id.includes('open_library') || n.includes('open library')) return <OpenLibraryIcon {...props} />;

  return <GenericPlatformIcon name={name} {...props} />;
}
