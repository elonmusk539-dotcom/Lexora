'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, Trash2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'info' | 'confirm'>('info');

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.username || authUser.user_metadata?.full_name || 'User',
      });
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!user || confirmText !== 'DELETE') return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-xl mx-auto">
          {/* Back Link */}
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </Link>

          <div className="card-elevated p-6 sm:p-8">
            {step === 'info' ? (
              <>
                {/* Warning Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-red-500/10">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                      Delete Account
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      This action is permanent and cannot be undone
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-4 glass rounded-xl mb-6">
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">Signed in as</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{user?.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
                </div>

                {/* What Will Be Deleted */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">
                    The following data will be permanently deleted:
                  </h3>
                  <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Your profile, username, and avatar
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      All vocabulary progress and mastery data
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Custom word lists and custom vocabulary
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Quiz and review history
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Streak data and activity log
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Subscription information
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Your authentication account
                    </li>
                  </ul>
                </div>

                {/* Data Safety Note */}
                <div className="p-4 rounded-xl bg-ocean-500/10 border border-ocean-500/30 mb-6">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-ocean-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-ocean-600 dark:text-ocean-400">
                      If you have an active Pro subscription through Google Play, please cancel it
                      in the Google Play Store app before deleting your account to avoid continued billing.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('confirm')}
                  className="w-full py-3 px-4 bg-red-500 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
                >
                  I understand, proceed to delete
                </button>
              </>
            ) : (
              <>
                {/* Confirmation Step */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-red-500/10">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                      Confirm Deletion
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Type DELETE to confirm
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    To permanently delete your account <strong className="text-[var(--color-text-primary)]">{user?.email}</strong>,
                    type <strong className="text-red-500">DELETE</strong> in the box below:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="input w-full py-3 text-center text-lg font-mono tracking-widest"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('info');
                      setConfirmText('');
                      setError('');
                    }}
                    className="flex-1 py-3 px-4 glass rounded-xl font-medium text-[var(--color-text-secondary)] transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={confirmText !== 'DELETE' || deleting}
                    className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Forever
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
