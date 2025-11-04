import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(diagnostics);
}
