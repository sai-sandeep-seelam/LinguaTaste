#!/usr/bin/env node
/**
 * LinguaTaste Safe Integration Diagnostics Script
 * Run locally with: node scripts/diagnose.mjs
 *
 * Verifies Qloo entity search, Qloo insights recommendations, and TMDB authentication.
 * Never prints secret values.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Environment Loader ──────────────────────────────────────────────────────

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  let loadedFrom = null;

  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.trim().length > 0) {
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
        loadedFrom = file;
        break;
      }
    }
  }

  return loadedFrom;
}

const loadedFile = loadEnv();

console.log('\n======================================================');
console.log('       LinguaTaste Integration Diagnostics            ');
console.log('======================================================\n');

if (loadedFile) {
  console.log(`✓ Loaded environment configuration from: ${loadedFile}`);
} else {
  console.log('⚠ No non-empty .env or .env.local file found on disk.');
  console.log('  If you just typed credentials in VS Code, remember to save the file (Ctrl+S)!\n');
}

// ─── Environment Variable Audit ──────────────────────────────────────────────

const rawQlooKey = (process.env.QLOO_API_KEY || process.env.QLOO_KEY || '').trim();
const isPlaceholderQloo = rawQlooKey.includes('your_qloo_api_key') || rawQlooKey === 'your_key_here';
const qlooKey = isPlaceholderQloo ? '' : rawQlooKey;

const qlooBaseUrl = (process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com').trim().replace(/\/+$/, '');

const rawTmdbToken = (process.env.TMDB_API_READ_ACCESS_TOKEN || '').trim();
const isPlaceholderTmdb = rawTmdbToken.includes('your_tmdb_read_access_token') || rawTmdbToken === 'your_token_here';
const tmdbReadToken = isPlaceholderTmdb ? '' : rawTmdbToken;

const rawTmdbKey = (process.env.TMDB_API_KEY || process.env.TMDB_KEY || '').trim();
const isPlaceholderTmdbKey = rawTmdbKey.includes('your_tmdb_v3_api_key') || rawTmdbKey === 'your_key_here';
const tmdbApiKey = isPlaceholderTmdbKey ? '' : rawTmdbKey;

const rawAnthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();
const isPlaceholderAnthropic = rawAnthropicKey.includes('your_anthropic_api_key') || !rawAnthropicKey.startsWith('sk-');
const anthropicKey = isPlaceholderAnthropic ? '' : rawAnthropicKey;

console.log('Environment Variables Configuration:');
console.log(`  QLOO_API_KEY:             ${qlooKey ? `Configured (${qlooKey.length} chars, format: ${qlooKey.slice(0, 3)}...${qlooKey.slice(-3)})` : isPlaceholderQloo ? 'PLACEHOLDER DETECTED in .env.local (Replace with your actual Qloo key)' : 'MISSING (Using simulated Taste Graph fallback)'}`);
console.log(`  QLOO_BASE_URL:            ${qlooBaseUrl}`);
console.log(`  TMDB_API_READ_ACCESS_TOKEN: ${tmdbReadToken ? `Configured (${tmdbReadToken.length} chars, format: ${tmdbReadToken.slice(0, 3)}...${tmdbReadToken.slice(-3)})` : isPlaceholderTmdb ? 'Placeholder detected' : 'Not set (Open Library & Deezer active)'}`);
console.log(`  TMDB_API_KEY:             ${tmdbApiKey ? `Configured (${tmdbApiKey.length} chars, format: ${tmdbApiKey.slice(0, 3)}...${tmdbApiKey.slice(-3)})` : isPlaceholderTmdbKey ? 'Placeholder detected' : 'Not set'}`);
console.log(`  ANTHROPIC_API_KEY:        ${anthropicKey ? 'Configured' : 'Optional (Pedagogical heuristics active)'}`);
console.log('');

// ─── Qloo Integration Tests ──────────────────────────────────────────────────

async function testQloo() {
  console.log('--- 1. Testing Qloo Cultural Taste Graph API ---');
  if (!qlooKey) {
    if (isPlaceholderQloo) {
      console.log('  [NOTICE] QLOO_API_KEY is currently set to placeholder "your_qloo_api_key_here".');
      console.log('  Paste your actual Qloo key into .env.local OR use the in-app "Keys & Diagnostics" button in the browser.');
    } else {
      console.log('  [SKIPPED] QLOO_API_KEY is not configured in local environment.');
    }
    console.log('  LinguaTaste will run with high-fidelity simulated Taste Graph fallback.\n');
    return;
  }

  // A. Test Entity Search
  try {
    const searchUrl = `${qlooBaseUrl}/search?query=Radiohead&take=3&types=urn:entity:artist`;
    console.log(`  Testing endpoint: GET ${searchUrl}`);
    const searchRes = await fetch(searchUrl, {
      headers: {
        'X-Api-Key': qlooKey,
        'Accept': 'application/json',
      },
    });

    console.log(`  HTTP Status: ${searchRes.status} ${searchRes.statusText}`);
    const searchText = await searchRes.text();
    let searchData = null;
    try { searchData = JSON.parse(searchText); } catch {}

    if (searchRes.ok) {
      const rawList = Array.isArray(searchData?.results)
        ? searchData.results
        : Array.isArray(searchData?.entities)
        ? searchData.entities
        : Array.isArray(searchData?.results?.entities)
        ? searchData.results.entities
        : [];
      console.log(`  ✓ Qloo Search SUCCESS! Returned ${rawList.length} usable entities.`);
      if (rawList[0]) {
        console.log(`    Sample matched: "${rawList[0].name}" (ID: ${rawList[0].entity_id || rawList[0].id || 'N/A'})`);
      }
    } else {
      console.log(`  ✗ Qloo Search Failed with status ${searchRes.status}.`);
      console.log(`    Response summary: ${searchText.slice(0, 200)}`);
    }

    // B. Test Insights API
    const insightsUrl = `${qlooBaseUrl}/v2/insights?filter.type=urn:entity:movie&take=5&feature.explainability=true`;
    console.log(`  Testing endpoint: GET ${insightsUrl}`);
    const insightsRes = await fetch(insightsUrl, {
      headers: {
        'X-Api-Key': qlooKey,
        'Accept': 'application/json',
      },
    });

    console.log(`  HTTP Status: ${insightsRes.status} ${insightsRes.statusText}`);
    const insightsText = await insightsRes.text();
    let insightsData = null;
    try { insightsData = JSON.parse(insightsText); } catch {}

    if (insightsRes.ok) {
      const results = insightsData?.results || [];
      console.log(`  ✓ Qloo Insights SUCCESS! Returned ${results.length} recommendations.`);
    } else {
      console.log(`  ✗ Qloo Insights Failed with status ${insightsRes.status}.`);
      console.log(`    Response summary: ${insightsText.slice(0, 200)}`);
    }

  } catch (err) {
    console.log(`  ✗ Network error connecting to Qloo: ${err.message}`);
  }
  console.log('');
}

// ─── TMDB Integration Tests ──────────────────────────────────────────────────

async function testTmdb() {
  console.log('--- 2. Testing TMDB Artwork & Watch Providers API ---');

  let authType = null;
  let authValue = null;

  if (tmdbReadToken && (tmdbReadToken.startsWith('eyJ') || tmdbReadToken.length > 50)) {
    authType = 'bearer';
    authValue = tmdbReadToken;
  } else if (tmdbApiKey) {
    authType = tmdbApiKey.startsWith('eyJ') ? 'bearer' : 'apikey';
    authValue = tmdbApiKey;
  } else if (tmdbReadToken) {
    authType = 'apikey';
    authValue = tmdbReadToken;
  }

  if (!authType) {
    console.log('  [SKIPPED] No TMDB credential found in environment.');
    console.log('  Artwork will fall back to Open Library, Deezer, and styled placeholder gradients.\n');
    return;
  }

  console.log(`  Detected Credential Format: ${authType === 'bearer' ? 'v4 Read Access Token (Bearer)' : 'v3 API Key'}`);

  try {
    let testUrl = 'https://api.themoviedb.org/3/search/movie?query=Inception&page=1';
    const headers = { Accept: 'application/json' };

    if (authType === 'bearer') {
      headers.Authorization = `Bearer ${authValue}`;
    } else {
      testUrl += `&api_key=${authValue}`;
    }

    console.log('  Testing endpoint: GET https://api.themoviedb.org/3/search/movie');
    const res = await fetch(testUrl, { headers });
    console.log(`  HTTP Status: ${res.status} ${res.statusText}`);

    if (res.ok) {
      const data = await res.json();
      const first = data?.results?.[0];
      console.log(`  ✓ TMDB Authentication SUCCESS! Usable search results returned.`);
      if (first) {
        console.log(`    Sample movie: "${first.title}" (Release: ${first.release_date || 'N/A'}, Poster path: ${first.poster_path || 'None'})`);
      }
    } else {
      const errText = await res.text();
      console.log(`  ✗ TMDB Authentication Failed (HTTP ${res.status}).`);
      console.log(`    Details: ${errText.slice(0, 200)}`);
    }
  } catch (err) {
    console.log(`  ✗ Network error connecting to TMDB: ${err.message}`);
  }
  console.log('');
}

// ─── Execution ───────────────────────────────────────────────────────────────

async function run() {
  await testQloo();
  await testTmdb();
  console.log('======================================================');
  console.log('Diagnostics complete.');
  console.log('======================================================\n');
}

run();
