# Lexora Setup Instructions

## ✅ Completed Features

All 12 requested improvements have been implemented:

1. ✅ Furigana and romaji displayed on same line with brackets
2. ✅ Word details card formatting updated
3. ✅ Example text showing regular reading
4. ✅ Background scroll prevention in modals
5. ✅ Results page optimization (immediate navigation)
6. ✅ Settings database schema created
7. ✅ Flashcard 3D flip CSS fixed
8. ✅ Flashcard back redesigned (minimal display with "Show Details" button)
9. ✅ Quiz preferences persisted
10. ✅ **Dark mode implemented** - Toggle available in settings page
11. ✅ **Feedback feature implemented** - Form available in settings page with screenshot upload
12. ✅ Supabase setup guide created

---

## 🔧 Required Database Setup

You need to run these SQL commands in your Supabase SQL Editor:

### 1. Add Settings Column to User Profiles

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
```

### 2. Create Feedback Table

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'other')),
  message TEXT NOT NULL,
  screenshots TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON user_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## 📦 Required Storage Buckets

### 1. Avatar Bucket (Already exists, but verify settings)

Go to Supabase Dashboard → Storage → `avatars` bucket:
- ✅ Public access enabled
- ✅ Max file size: 2MB
- ✅ Allowed MIME types: image/*

**Storage Policy (if not already set):**
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. Feedback Screenshots Bucket (NEW - Must Create)

1. Go to Supabase Dashboard → Storage → Create new bucket
2. Bucket name: `feedback-screenshots`
3. Settings:
   - ⚠️ **Public access: DISABLED** (private bucket)
   - File size limit: 2MB
   - Allowed MIME types: image/*

**Storage Policy:**
```sql
-- Allow authenticated users to upload feedback screenshots
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own screenshots
CREATE POLICY "Users can view their own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own screenshots
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🎨 Dark Mode Features

Dark mode is now fully implemented with:
- ✨ Theme toggle in Settings page
- 💾 Theme preference saved to database (user_profiles.settings.theme)
- 🎯 Automatic theme persistence across sessions
- 🌓 Smooth transitions between light and dark modes
- 📱 Applied site-wide to all pages and components

### How to Use:
1. Go to Settings page
2. Find "Appearance" section at the top
3. Click the theme toggle button to switch between Light/Dark modes
4. Theme preference is saved automatically

---

## 💬 Feedback Feature

Users can now submit feedback with:
- 📝 Category selection (Bug, Feature Request, Improvement, Other)
- ✍️ Message text area
- 📸 Screenshot upload (up to 3 images, 2MB each)
- 🗜️ Automatic image compression if over 2MB
- ✅ Real-time validation and error messages

### How to Use:
1. Go to Settings page
2. Scroll down to "Send Feedback" section
3. Select category, write message, optionally upload screenshots
4. Click "Submit Feedback"

### Admin Access (Future):
You can view all feedback in Supabase Dashboard:
- Go to Table Editor → `user_feedback`
- View all submissions with user_id, category, message, and screenshot URLs
- Update status field as you process feedback

---

## 🚀 Testing Checklist

After running the database migrations and setting up storage buckets:

### Test Dark Mode:
1. ✅ Open the app and go to Settings
2. ✅ Toggle between light and dark modes
3. ✅ Refresh the page - theme should persist
4. ✅ Navigate to different pages - theme should apply everywhere
5. ✅ Log out and log back in - theme should be remembered

### Test Feedback Feature:
1. ✅ Go to Settings → Send Feedback section
2. ✅ Try submitting without a message - should show error
3. ✅ Select a category and write a test message
4. ✅ Upload 1-3 screenshots (try different image sizes)
5. ✅ Submit and verify success message
6. ✅ Check Supabase Table Editor → `user_feedback` to see your submission
7. ✅ Check Supabase Storage → `feedback-screenshots` to see uploaded images

### Test Other Features:
1. ✅ Word list - verify furigana and romaji on same line
2. ✅ Word details card - verify formatting and examples
3. ✅ Background scroll - open word details and try scrolling
4. ✅ Flashcard quiz - test front/back display and "Show Details" button
5. ✅ MCQ quiz - test immediate navigation to results
6. ✅ Settings - verify all preferences save correctly

---

## 📋 File Reference

### New Files Created:
- `contexts/ThemeContext.tsx` - Theme management with DB persistence
- `lib/supabase/settings-column-schema.sql` - Settings column migration
- `lib/supabase/feedback-schema.sql` - Feedback table schema
- `SUPABASE-SETUP-GUIDE.md` - Detailed Supabase setup instructions
- `SETUP-INSTRUCTIONS.md` - This file

### Modified Files:
- `app/layout.tsx` - Wrapped with ThemeProvider
- `app/settings/page.tsx` - Added dark mode toggle and feedback form
- `app/globals.css` - Added dark mode CSS variables and 3D transform classes
- `components/WordListItem.tsx` - Updated furigana/romaji formatting
- `components/WordDetailsCard.tsx` - Updated formatting and scroll prevention
- `app/quiz/flashcard/page.tsx` - Redesigned flashcard back
- `app/quiz/mcq/page.tsx` - Optimized results page transition

---

## ⚠️ Important Notes

1. **Database Migrations**: Must be run before testing dark mode and feedback features
2. **Storage Buckets**: `feedback-screenshots` bucket must be created manually in Supabase
3. **TypeScript Errors**: Some Supabase type inference errors may appear - these are non-breaking
4. **Image Compression**: The `browser-image-compression` package is already installed in package.json

---

## 🎉 All Done!

Once you've completed the database setup steps above, all features are ready to use. The app now has:
- ✨ Beautiful dark mode
- 💬 Comprehensive feedback system
- 📱 Improved UI/UX across all pages
- 🚀 Optimized performance
- 💾 Persistent user preferences

Enjoy using Lexora! 🎌📚
