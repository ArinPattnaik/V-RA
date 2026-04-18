import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  const ML_BASE = process.env.ML_SERVICE_URL; // optional — only set if you add it as a Vercel env var
  
  if (!API_BASE) {
    return NextResponse.json(
      { error: "API URL not configured in environment" },
      { status: 500 }
    );
  }

  const fetchOptions = {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };

  // Ping backend and ML service in parallel.
  // The backend's /api/health also pings the ML service internally (25s timeout),
  // but we also ping the ML service directly as a belt-and-suspenders approach.
  const [backendResult, mlResult] = await Promise.allSettled([
    fetch(`${API_BASE}/api/health`, fetchOptions),
    // Only ping ML directly if ML_SERVICE_URL is configured
    ML_BASE
      ? fetch(`${ML_BASE}/health`, { ...fetchOptions, signal: AbortSignal.timeout(30000) })
      : Promise.resolve(null),
  ]);

  let backendStatus = null;
  if (backendResult.status === 'fulfilled' && backendResult.value?.ok) {
    try { backendStatus = await backendResult.value.json(); } catch {}
  }

  const mlDirectStatus = mlResult.status === 'fulfilled' && mlResult.value !== null
    ? (mlResult.value?.ok ? 'connected' : 'error')
    : (ML_BASE ? 'timeout_or_error' : 'not_configured');

  return NextResponse.json({ 
    success: true, 
    backend_status: backendStatus ?? { note: "Backend ping failed or timed out — cold start initiated" },
    ml_direct_ping: mlDirectStatus,
    timestamp: new Date().toISOString()
  });
}
