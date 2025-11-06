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
      setSuccess('Avatar uploaded successfully! Don\'t forget to save your changes.');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
            {/* Page Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your account settings</p>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile avatar"
                    width={128}
                    height={128}
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-200"
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center border-4 border-purple-200">
                    <User className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" />
                  </div>
                )}
                {/* Upload button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {uploading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
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
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm"
              >
                {success}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSave} className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white dark:bg-gray-700"
                />
              </div>

              {/* Avatar Upload Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Avatar Upload</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Click the upload button on your avatar to change it. Maximum file size: 1MB. Images will be automatically compressed to 100-200KB for optimal performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : <><span className="md:hidden">Save</span><span className="hidden md:inline">Save Changes</span></>}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </motion.button>
              </div>
            </form>
          </div>

          {/* Statistics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
              Learning Statistics
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Words Mastered */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500 dark:bg-green-600 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Words Mastered</h4>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400 text-center md:text-left">{stats.wordsMastered}</p>
              </div>

              {/* Longest Streak */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 sm:p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500 dark:bg-orange-600 rounded-lg">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Longest Streak</h4>
                </div>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400 text-center md:text-left">{stats.longestStreak}</p>
              </div>

              {/* User Added Words */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500 dark:bg-purple-600 rounded-lg">
                    <BookPlus className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Words</h4>
                </div>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400 text-center md:text-left">{stats.userAddedWords}</p>
              </div>

              {/* Words Started Learning */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Words Learning</h4>
                </div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 text-center md:text-left">{stats.wordsStartedLearning}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
