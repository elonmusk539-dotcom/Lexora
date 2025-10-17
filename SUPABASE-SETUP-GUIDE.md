# Supabase Setup Instructions

## 1. Avatar Upload - Storage Bucket Setup

### Create Avatars Bucket:

1. **Go to Supabase Dashboard** → Your Project → Storage
2. **Click "Create new bucket"**
3. **Configure the bucket:**
   - **Name**: `avatars`
   - **Public bucket**: ✅ Check this (so avatars are publicly accessible)
   - **File size limit**: 2MB (optional, for safety)
   - **Allowed MIME types**: `image/*` (optional)
4. **Click "Create bucket"**

### Set Storage Policies:

After creating the bucket, set up these policies in SQL Editor:

```sql
-- Policy 1: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow authenticated users to update their own avatars  
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow public read access to all avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Note**: The upload function uses folder structure `{userId}/{filename}` which matches the RLS policy.

---

## 2. Feedback Screenshots - Storage Bucket Setup

### Create Feedback Bucket:

1. **Go to Supabase Dashboard** → Your Project → Storage
2. **Click "Create new bucket"**
3. **Configure the bucket:**
   - **Name**: `feedback-screenshots`
   - **Public bucket**: ✅ Check this (so admins can view screenshots)
   - **File size limit**: 2MB per file
   - **Allowed MIME types**: `image/*`
4. **Click "Create bucket"**

### Set Storage Policies:

```sql
-- Policy 1: Allow authenticated users to upload feedback screenshots
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to view their own screenshots
CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-screenshots' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Add admin check here if you have admin roles
    auth.jwt() ->> 'role' = 'admin'
  )
);
```

---

## 3. Database Schema Updates

### Apply Settings Column:

Run `lib/supabase/settings-column-schema.sql` in the SQL Editor:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
```

### Create Feedback Table:

Run `lib/supabase/feedback-schema.sql` in the SQL Editor to create the `user_feedback` table with RLS policies.

---

## 4. Viewing Feedback (Admin)

To view user feedback submissions, you can:

### Option 1: Supabase Dashboard
1. Go to **Table Editor** → `user_feedback`
2. View all feedback submissions
3. Click on screenshot URLs to view images

### Option 2: Create Admin Panel (Future Enhancement)
Create a Next.js admin route that queries:
```typescript
const { data: feedback } = await supabase
  .from('user_feedback')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## 5. Storage Structure

After setup, your storage will look like:

```
Storage
├── avatars/
│   ├── user-uuid-1-timestamp.jpg
│   ├── user-uuid-2-timestamp.png
│   └── ...
└── feedback-screenshots/
    ├── user-uuid-1/
    │   ├── feedback-id-1-screenshot-1.jpg
    │   ├── feedback-id-1-screenshot-2.png
    │   └── ...
    └── user-uuid-2/
        └── ...
```

---

## 6. Verify Setup

Test avatar upload:
1. Go to your app's profile page
2. Click the upload button on your avatar
3. Select an image
4. Check Supabase Storage → avatars bucket for the uploaded file

Test feedback submission (after dark mode implementation):
1. Go to Settings page
2. Fill out feedback form
3. Upload screenshots
4. Submit
5. Check Supabase → user_feedback table for the entry
6. Check feedback-screenshots bucket for uploaded images

---

## Troubleshooting

### "Error uploading avatar"
- Check if `avatars` bucket exists
- Verify RLS policies are set correctly
- Check browser console for specific error

### "Failed to save settings"
- Run the settings-column-schema.sql
- Verify `settings` column exists in `user_profiles` table

### "Feedback submission failed"
- Run feedback-schema.sql
- Check if `user_feedback` table exists
- Verify RLS policies on the table

---

## Security Notes

- Avatars are public (anyone can view if they have the URL)
- Feedback screenshots are semi-private (only user and admins can access)
- All uploads require authentication
- File size limits prevent abuse
- RLS policies ensure users can only modify their own data
