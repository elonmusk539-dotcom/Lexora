import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Admin client for privileged database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Authenticate the user from their session cookie — never trust client-provided userId
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    // 1. Validate the code
    const { data: discountCode, error: codeError } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeError || !discountCode) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 });
    }

    if (!discountCode.is_active) {
      return NextResponse.json({ error: 'This discount code is inactive' }, { status: 400 });
    }

    if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
      return NextResponse.json({ error: 'This discount code has reached its maximum usage limit' }, { status: 400 });
    }

    // 2. Check if user already has an active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSub) {
      return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 });
    }

    // 3. Apply Discount
    if (discountCode.discount_percent === 100) {
      // 100% off - Grant direct subscription
      const durationMonths = discountCode.duration_months || 1;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Upsert subscription
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'active',
          provider: 'internal',
          discount_code: code,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          interval: 'month',
          cancel_at_period_end: true,
        }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Subscription creation error:', subError);
        return NextResponse.json({ error: 'Failed to apply subscription' }, { status: 500 });
      }

      // 4. Increment usage count
      await supabaseAdmin
        .from('discount_codes')
        .update({ current_uses: discountCode.current_uses + 1 })
        .eq('code', code);

      return NextResponse.json({ success: true, message: 'Discount code redeemed successfully!' });
    } else {
      return NextResponse.json({ error: 'Partial discounts not yet implemented' }, { status: 501 });
    }

  } catch (error) {
    console.error('Redeem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
