import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  testQlooConnection,
  getQlooApiKey,
  getQlooBaseUrl,
  setRuntimeQlooConfig,
  clearQlooCache,
} from '@/lib/qloo';
import {
  testTmdbConnection,
  getTmdbAuth,
  setRuntimeTmdbAuth,
  clearArtworkCache,
} from '@/lib/artwork';
import { hasValidGeminiKey, GEMINI_CONFIG } from '@/lib/gemini';

function updateEnvLocalFile(updates: Record<string, string>) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split(/\r?\n/);
    const updatedKeys = new Set<string>();

    const newLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        if (key in updates) {
          updatedKeys.add(key);
          return `${key}=${updates[key]}`;
        }
      }
      return line;
    });

    for (const [key, value] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${value}`);
      }
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to update .env.local file:', err);
    return false;
  }
}

export async function GET() {
  const qlooKey = getQlooApiKey();
  const qlooBaseUrl = getQlooBaseUrl();
  const tmdbAuth = getTmdbAuth();
  const isGeminiConfigured = hasValidGeminiKey();

  // Test Qloo independently
  const qlooDiag = await testQlooConnection();

  // Test TMDB independently
  const tmdbDiag = await testTmdbConnection();

  const geminiKey = process.env.GEMINI_API_KEY;

  const envAudit = {
    QLOO_API_KEY: {
      configured: Boolean(qlooKey),
      length: qlooKey ? qlooKey.length : 0,
      formatHint: qlooKey ? `${qlooKey.slice(0, 3)}...${qlooKey.slice(-3)}` : 'missing',
    },
    QLOO_BASE_URL: qlooBaseUrl,
    TMDB_CREDENTIAL: {
      configured: Boolean(tmdbAuth),
      detectedType: tmdbAuth ? tmdbAuth.type : 'none',
      tokenLength: tmdbAuth ? tmdbAuth.token.length : 0,
      formatHint: tmdbAuth
        ? `${tmdbAuth.token.slice(0, 3)}...${tmdbAuth.token.slice(-3)}`
        : 'missing',
    },
    GEMINI_API_KEY: {
      configured: isGeminiConfigured,
      model: GEMINI_CONFIG.model,
      formatHint: geminiKey && geminiKey.length > 8 ? `${geminiKey.slice(0, 4)}...${geminiKey.slice(-4)}` : 'missing',
    },
    ANTHROPIC_API_KEY: {
      configured: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-')),
      status: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-')) ? 'configured' : 'optional_fallback_active',
    },
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: (qlooDiag.search.success && tmdbDiag.authenticated) ? 'healthy' : 'partial_or_simulated',
    environment: envAudit,
    qloo: {
      endpoint: qlooBaseUrl,
      configured: qlooDiag.configured,
      search: {
        testedEndpoint: `${qlooBaseUrl}/search`,
        status: qlooDiag.search.statusCode || 0,
        source: qlooDiag.search.source,
        success: qlooDiag.search.success,
        usableEntitiesCount: qlooDiag.search.entitiesCount,
        sampleEntity: qlooDiag.search.sampleEntityName || null,
        error: qlooDiag.search.error || null,
      },
      insights: {
        testedEndpoint: `${qlooBaseUrl}/v2/insights`,
        status: qlooDiag.insights.statusCode || 0,
        source: qlooDiag.insights.source,
        success: qlooDiag.insights.success,
        usableResultsCount: qlooDiag.insights.resultsCount,
        sampleCandidate: qlooDiag.insights.sampleCandidate || null,
        error: qlooDiag.insights.error || null,
      },
    },
    tmdb: {
      configured: tmdbDiag.configured,
      authType: tmdbDiag.authType || 'none',
      authenticated: tmdbDiag.authenticated,
      status: tmdbDiag.statusCode || 0,
      sampleResult: tmdbDiag.sampleResult || null,
      error: tmdbDiag.error || null,
    },
    gemini: {
      configured: isGeminiConfigured,
      model: GEMINI_CONFIG.model,
      status: isGeminiConfigured ? 'active_taste_reasoning' : 'deterministic_fallbacks_active',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      qlooApiKey?: string;
      qlooBaseUrl?: string;
      tmdbApiKey?: string;
      geminiApiKey?: string;
      geminiModel?: string;
      anthropicApiKey?: string;
      saveToEnv?: boolean;
    };

    const envUpdates: Record<string, string> = {};

    // 1. Handle Qloo API Key & Base URL
    if (body.qlooApiKey !== undefined) {
      const cleanQloo = body.qlooApiKey.trim();
      setRuntimeQlooConfig(cleanQloo, body.qlooBaseUrl);
      clearQlooCache();
      process.env.QLOO_API_KEY = cleanQloo;
      if (cleanQloo) envUpdates['QLOO_API_KEY'] = cleanQloo;
    }

    if (body.qlooBaseUrl !== undefined) {
      const cleanUrl = body.qlooBaseUrl.trim();
      setRuntimeQlooConfig(undefined, cleanUrl);
      process.env.QLOO_BASE_URL = cleanUrl;
      if (cleanUrl) envUpdates['QLOO_BASE_URL'] = cleanUrl;
    }

    // 2. Handle TMDB Credentials
    if (body.tmdbApiKey !== undefined) {
      const cleanTmdb = body.tmdbApiKey.trim();
      clearArtworkCache();
      if (!cleanTmdb) {
        setRuntimeTmdbAuth(null);
      } else if (cleanTmdb.startsWith('eyJ') || cleanTmdb.length > 50) {
        setRuntimeTmdbAuth({ type: 'bearer', token: cleanTmdb });
        process.env.TMDB_API_READ_ACCESS_TOKEN = cleanTmdb;
        envUpdates['TMDB_API_READ_ACCESS_TOKEN'] = cleanTmdb;
      } else {
        setRuntimeTmdbAuth({ type: 'apikey', token: cleanTmdb });
        process.env.TMDB_API_KEY = cleanTmdb;
        envUpdates['TMDB_API_KEY'] = cleanTmdb;
      }
    }

    // 3. Handle Gemini API Key & Model
    if (body.geminiApiKey !== undefined) {
      const cleanGemini = body.geminiApiKey.trim();
      process.env.GEMINI_API_KEY = cleanGemini;
      if (cleanGemini) envUpdates['GEMINI_API_KEY'] = cleanGemini;
    }
    if (body.geminiModel !== undefined && body.geminiModel.trim()) {
      const cleanModel = body.geminiModel.trim();
      process.env.GEMINI_MODEL = cleanModel;
      envUpdates['GEMINI_MODEL'] = cleanModel;
    }

    // 4. Handle Anthropic API Key
    if (body.anthropicApiKey !== undefined) {
      const cleanAnthropic = body.anthropicApiKey.trim();
      process.env.ANTHROPIC_API_KEY = cleanAnthropic;
      if (cleanAnthropic) envUpdates['ANTHROPIC_API_KEY'] = cleanAnthropic;
    }

    // 5. Save to .env.local if requested
    let savedToEnv = false;
    if (body.saveToEnv && Object.keys(envUpdates).length > 0) {
      savedToEnv = updateEnvLocalFile(envUpdates);
    }

    // 6. Test Live Connectivity
    const qlooDiag = await testQlooConnection();
    const tmdbDiag = await testTmdbConnection();
    const isGeminiConfigured = hasValidGeminiKey();

    return NextResponse.json({
      success: true,
      savedToEnv,
      timestamp: new Date().toISOString(),
      qloo: {
        configured: qlooDiag.configured,
        endpoint: getQlooBaseUrl(),
        search: qlooDiag.search,
        insights: qlooDiag.insights,
      },
      tmdb: {
        configured: tmdbDiag.configured,
        authType: tmdbDiag.authType || 'none',
        authenticated: tmdbDiag.authenticated,
        status: tmdbDiag.statusCode || 0,
        sampleResult: tmdbDiag.sampleResult || null,
        error: tmdbDiag.error || null,
      },
      gemini: {
        configured: isGeminiConfigured,
        model: GEMINI_CONFIG.model,
        status: isGeminiConfigured ? 'active_taste_reasoning' : 'deterministic_fallbacks_active',
      },
      environment: {
        QLOO_API_KEY: Boolean(getQlooApiKey()),
        TMDB_CREDENTIAL: Boolean(getTmdbAuth()),
        GEMINI_API_KEY: isGeminiConfigured,
        ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-')),
      },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Diagnostics update failed';
    console.error('Diagnostics POST error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
