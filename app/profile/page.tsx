'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Mail, Image as ImageIcon, Save, LogOut, Upload, Trophy, Flame, BookPlus, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    wordsMastered: 0,
    longestStreak: 0,
    userAddedWords: 0,
    wordsStartedLearning: 0,
  });

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || '');
      }

      // Load statistics
      await loadStatistics(user.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatistics(userId: string) {
    try {
      // Words mastered (is_mastered = true)
      const { count: masteredCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_mastered', true);

      // Longest streak (from user_profiles table)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('longest_streak')
        .eq('user_id', userId)
        .single();

      // User added words (custom words)
      const { count: customWordsCount } = await supabase
        .from('user_custom_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Words started learning (any progress exists, excluding mastered)
      const { count: startedLearningCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_mastered', false);

      setStats({
        wordsMastered: masteredCount || 0,
        longestStreak: profileData?.longest_streak || 0,
        userAddedWords: customWordsCount || 0,
        wordsStartedLearning: startedLearningCount || 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!user) {
      setError('You must be logged in');
      setSaving(false);
      return;
    }

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            username,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            username,
            avatar_url: avatarUrl,
          });

        if (insertError) throw insertError;
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setError('');
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        setError('File size must be less than 1MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Compress image to 100-200KB
      const options = {
        maxSizeMB: 0.2, // 200KB max
        maxWidthOrHeight: 400,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Upload to Supabase Storage with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setSuccess('Avatar uploaded! Don\'t forget to save.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error uploading avatar';
      setError(errorMessage);
    } finally {
      setUploading(false);
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
      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="card-elevated p-6 sm:p-8">
            {/* Page Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-2">My Profile</h2>
              <p className="text-[var(--color-text-muted)]">Manage your account settings</p>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile avatar"
                    width={128}
                    height={128}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover ring-4 ring-[var(--color-accent-primary)]/30"
                    sizes="(max-width: 640px) 112px, 128px"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center ring-4 ring-[var(--color-accent-primary)]/30 shadow-glow">
                    <User className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                  </div>
                )}
                {/* Upload button overlay */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 p-2.5 bg-gradient-to-br from-coral-500 to-coral-400 text-white rounded-xl shadow-glow-coral disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-sm"
              >
                {success}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-coral-500/10 border border-coral-500/30 rounded-xl text-coral-500 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSave} className="space-y-5">
              {/* Email (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input w-full py-3 opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Email cannot be changed</p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <User className="w-4 h-4" />
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input w-full py-3"
                />
              </div>

              {/* Avatar Upload Info */}
              <div className="p-4 glass rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-accent-primary)]/10">
                    <ImageIcon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Avatar Upload</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Click the upload button on your avatar to change it. Max 1MB, auto-compressed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-ghost py-3 px-5 flex items-center gap-2 hover:text-coral-500 hover:border-coral-500/30"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </motion.button>
              </div>
            </form>
          </div>

          {/* Statistics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 card-elevated p-6 sm:p-8"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-6 text-center">
              Learning Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Words Mastered */}
              <div className="p-4 sm:p-5 glass rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Mastered</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-500">{stats.wordsMastered}</p>
              </div>

              {/* Longest Streak */}
              <div className="p-4 sm:p-5 glass rounded-xl bg-gradient-to-br from-orange-500/10 to-coral-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-coral-500 rounded-xl shadow-lg">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Best Streak</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-orange-500">{stats.longestStreak}</p>
              </div>

              {/* User Added Words */}
              <div className="p-4 sm:p-5 glass rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <BookPlus className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Custom Words</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-500">{stats.userAddedWords}</p>
              </div>

              {/* Words Started Learning */}
              <div className="p-4 sm:p-5 glass rounded-xl bg-gradient-to-br from-ocean-500/10 to-cyan-500/10 border border-ocean-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-ocean-500 to-cyan-500 rounded-xl shadow-lg">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Learning</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-ocean-500">{stats.wordsStartedLearning}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
