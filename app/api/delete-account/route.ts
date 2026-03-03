import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role key to bypass RLS and delete all user data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete user data from all tables (order matters due to foreign keys)
    // Delete child records first, then parent records

    // 1. Custom list word associations
    const { error: clwError } = await supabaseAdmin
      .from('user_custom_list_words')
      .delete()
      .eq('user_id', userId);
    if (clwError) console.error('Error deleting custom list words:', clwError);

    // 2. Custom list custom word associations
    const { error: clcwError } = await supabaseAdmin
      .from('user_custom_list_custom_words')
      .delete()
      .eq('user_id', userId);
    if (clcwError) console.error('Error deleting custom list custom words:', clcwError);

    // 3. Custom lists
    const { error: clError } = await supabaseAdmin
      .from('user_custom_lists')
      .delete()
      .eq('user_id', userId);
    if (clError) console.error('Error deleting custom lists:', clError);

    // 4. Custom words
    const { error: cwError } = await supabaseAdmin
      .from('user_custom_words')
      .delete()
      .eq('user_id', userId);
    if (cwError) console.error('Error deleting custom words:', cwError);

    // 5. User progress
    const { error: upError } = await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('user_id', userId);
    if (upError) console.error('Error deleting user progress:', upError);

    // 6. Activity log
    const { error: alError } = await supabaseAdmin
      .from('user_activity_log')
      .delete()
      .eq('user_id', userId);
    if (alError) console.error('Error deleting activity log:', alError);

    // 7. Subscriptions
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    if (subError) console.error('Error deleting subscriptions:', subError);

    // 8. User profile (last, as other tables may reference it)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);
    if (profileError) console.error('Error deleting user profile:', profileError);

    // 9. Delete the auth user itself
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete authentication account. Data was cleared.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Account and all data deleted successfully.' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account deletion.' },
      { status: 500 }
    );
  }
}
