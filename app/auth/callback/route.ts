import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If there's an error from the OAuth provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: true,
          flowType: 'pkce',
        }
      }
    );
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Token exchange error:', exchangeError);
        return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
      }

      if (data?.session) {
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
              console.error('Profile creation error:', createError);
              // Don't fail the auth, profile might be created by trigger
            }
          }
        }

        // Create response with redirect
        const response = NextResponse.redirect(`${origin}/`);
        
        // Set session cookies
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false,
        });
        
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false,
        });

        return response;
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
