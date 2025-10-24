# Database Setup Guide for Custom Words Feature

## Prerequisites
- Access to Supabase project dashboard
- SQL Editor access

## Steps to Deploy

### 1. Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `lib/supabase/custom-words-schema.sql`
5. Click **Run** to execute the script

### 2. Verify Tables Created

After running the migration, verify these tables exist in your database:

- `user_custom_words`
- `user_custom_list_custom_words`

Check by going to **Table Editor** in Supabase dashboard.

### 3. Verify RLS Policies

Navigate to **Authentication > Policies** and verify that policies are enabled for:

- `user_custom_words`:
  - Users can view their own custom words
  - Users can create their own custom words
  - Users can update their own custom words
  - Users can delete their own custom words

- `user_custom_list_custom_words`:
  - Users can view custom words in their lists
  - Users can add custom words to their lists
  - Users can remove custom words from their lists

### 4. Verify Indexes

Check that these indexes were created for performance:

- `idx_custom_words_user_id`
- `idx_custom_words_created_at`
- `idx_custom_words_search` (GIN index for full-text search)
- `idx_custom_list_custom_words_list_id`
- `idx_custom_list_custom_words_word_id`

### 5. Test the Feature

1. Log in to the application
2. Navigate to **My Lists**
3. Click **View Words** on any custom list
4. Click **Create Custom Word**
5. Fill in the form and upload an image
6. Verify the word appears in the list
7. Start a quiz and verify custom words are included

## Cloudinary Configuration

The app uses these Cloudinary settings (already configured in the code):

```javascript
CLOUDINARY_CLOUD_NAME = 'dkdmhcm6c'
CLOUDINARY_UPLOAD_PRESET = 'Lexora user word image upload preset'
```

### Verify Cloudinary Upload Preset

1. Log in to Cloudinary dashboard
2. Go to **Settings > Upload**
3. Scroll to **Upload presets**
4. Verify preset "Lexora user word image upload preset" exists
5. If not, create it with these settings:
   - Signing Mode: **Unsigned**
   - Folder: `lexora/custom-words`
   - Access Mode: **Public**

## Rollback Instructions

If you need to rollback the database changes:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS update_custom_word_timestamp ON user_custom_words;

-- Remove functions
DROP FUNCTION IF EXISTS update_custom_word_timestamp();

-- Remove RLS policies
DROP POLICY IF EXISTS "Users can delete their own custom words" ON user_custom_words;
DROP POLICY IF EXISTS "Users can update their own custom words" ON user_custom_words;
DROP POLICY IF EXISTS "Users can create their own custom words" ON user_custom_words;
DROP POLICY IF EXISTS "Users can view their own custom words" ON user_custom_words;

DROP POLICY IF EXISTS "Users can remove custom words from their lists" ON user_custom_list_custom_words;
DROP POLICY IF EXISTS "Users can add custom words to their lists" ON user_custom_list_custom_words;
DROP POLICY IF EXISTS "Users can view custom words in their lists" ON user_custom_list_custom_words;

-- Remove tables (CASCADE will remove related data)
DROP TABLE IF EXISTS user_custom_list_custom_words CASCADE;
DROP TABLE IF EXISTS user_custom_words CASCADE;
```

## Troubleshooting

### Issue: Tables not created
**Solution:** Check for SQL syntax errors in the output console. Ensure you're running the script in the correct database.

### Issue: RLS policies not working
**Solution:** Verify that RLS is enabled on the tables:
```sql
ALTER TABLE user_custom_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_list_custom_words ENABLE ROW LEVEL SECURITY;
```

### Issue: Cloudinary upload fails
**Solution:** 
1. Verify upload preset name matches exactly
2. Check that preset is set to "unsigned" mode
3. Verify cloud name is correct
4. Check browser console for detailed error messages

### Issue: Custom words not appearing in quiz
**Solution:**
1. Verify words are properly linked to lists in `user_custom_list_custom_words`
2. Check that quiz is selecting the correct list IDs
3. Verify the word transformation logic in quiz pages

## Monitoring

After deployment, monitor:

1. **Cloudinary Usage:** Check dashboard for upload statistics
2. **Database Performance:** Monitor query performance for custom word fetches
3. **Error Logs:** Watch for any errors related to custom word creation
4. **User Engagement:** Track how many users create custom words

## Support

For issues or questions:
1. Check browser console for client-side errors
2. Check Supabase logs for database errors
3. Verify Cloudinary dashboard for upload issues
4. Review `IMPLEMENTATION-SUMMARY.md` for feature details
