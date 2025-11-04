import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
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
    console.log('[Auth Callback] Processing code...', code.substring(0, 20) + '...');

    const pendingCookies = new Map<string, { value: string; options?: CookieOptions }>();

    const applyCookies = (response: NextResponse) => {
      console.log('[Auth Callback] Applying cookies, count:', pendingCookies.size);
      pendingCookies.forEach(({ value, options }, name) => {
        console.log('[Auth Callback] Setting cookie:', name, 'length:', value.length);
        response.cookies.set({ name, value, ...(options ?? {}) });
      });
      return response;
    };

    // Create a Supabase client with cookie support for proper session handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
            console.log('[Auth Callback] Reading cookies, count:', cookies.length);
            return cookies;
          },
          setAll(cookiesToSet) {
            console.log('[Auth Callback] Setting cookies, count:', cookiesToSet.length);
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.set(name, { value, options });
            });
          },
        },
      }
    );

    try {
      console.log('[Auth Callback] Exchanging code for session...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback] Token exchange error:', {
          message: exchangeError.message,
          status: exchangeError.status,
          name: exchangeError.name,
          code: code?.substring(0, 20) + '...',
        });
        return applyCookies(NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message || 'auth_exchange_failed')}`));
      }

      console.log('[Auth Callback] Exchange response:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userId: data?.user?.id,
      });

      if (data?.user) {
        console.log('[Auth Callback] Session obtained successfully');
        console.log('[Auth Callback] User ID:', data.user.id);

        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile && !profileError) {
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
        } else if (profileError) {
          console.error('[Auth Callback] Profile lookup error:', profileError);
        }
      }

      console.log('[Auth Callback] Session established, redirecting...');
      const redirectUrl = new URL(next, origin);
      if (redirectUrl.origin !== origin) {
        redirectUrl.href = `${origin}/`;
      }

      return applyCookies(NextResponse.redirect(redirectUrl));
    } catch (callbackError) {
      console.error('[Auth Callback] Auth callback exception:', callbackError);
      return applyCookies(NextResponse.redirect(`${origin}/login?error=auth_callback_failed`));
    }
  }

  // No code present, redirect to login
  console.log('[Auth Callback] No code present in request');
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
