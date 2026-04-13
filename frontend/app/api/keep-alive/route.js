import { NextResponse } from "next/server";

export async function GET() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_BASE) {
    return NextResponse.json(
      { error: "API URL not configured in environment" },
      { status: 500 }
    );
  }

  try {
    // Ping the backend's health check. 
    // The backend's health check also pings the ML service health check.
    // This simple GET request wakes up both Render instances if they are sleeping.
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json({ success: true, backend_status: data });
  } catch (error) {
    // We return 200 even on error so the cron job doesn't falsely report failure 
    // just because the server took slightly over the Vercel 10s timeout to wake up.
    // The initial request will still trigger Render to spin up the instance.
    return NextResponse.json({ success: false, note: "Wake up initiated", error: error.message });
  }
}
