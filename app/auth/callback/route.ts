import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('[Auth Callback] Request URL:', requestUrl.toString());
  console.log('[Auth Callback] Code present:', !!code);
  console.log('[Auth Callback] Error:', error, errorDescription);

  // If there's an error from the OAuth provider
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    console.log('[Auth Callback] Processing code...');
    // Create a Supabase client with session persistence
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    );
    
    try {
      console.log('[Auth Callback] Exchanging code for session...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[Auth Callback] Token exchange error:', exchangeError);
        return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
      }

      if (data?.session) {
        console.log('[Auth Callback] Session obtained successfully');
        console.log('[Auth Callback] User ID:', data.user?.id);
        
        // Check if user profile exists, create if not
        if (data.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || '',
                username: data.user.email?.split('@')[0] || 'user',
                created_at: new Date().toISOString(),
              });

            if (createError) {
              console.error('[Auth Callback] Profile creation error:', createError);
            }
          }
        }

        console.log('[Auth Callback] Session established, redirecting to home...');
        // Redirect directly to home - session is now stored in Supabase client
        return NextResponse.redirect(`${origin}/`);
      }
    } catch (error) {
      console.error('[Auth Callback] Auth callback exception:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  }

  // No code present, redirect to login
  console.log('[Auth Callback] No code present in request');
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
