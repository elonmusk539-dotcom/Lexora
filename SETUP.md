# Lexora - Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
Already done! All packages are installed.

### 2. Set Up Supabase

1. **Create a Supabase Project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for the project to be created

2. **Get Your Credentials:**
   - Go to Project Settings > API
   - Copy the "Project URL"
   - Copy the "anon public" key

3. **Update Environment Variables:**
   - Open `.env.local` in the root directory
   - Replace the placeholder values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Set Up Database

1. **Run the Schema:**
   - In Supabase, go to SQL Editor
   - Click "New Query"
   - Copy and paste the contents of `lib/supabase/schema.sql`
   - Click "Run"
   - You should see success messages

2. **Add Sample Data:**
   - Go to Table Editor
   - Click on `vocabulary_lists`
   - Click "Insert" > "Insert row"
   - Add a list (e.g., "Common Japanese Words")
   - Copy the ID of the created list

3. **Add Sample Words:**
   - Go to `vocabulary_words` table
   - Click "Insert" > "Insert row"
   - Fill in the fields:
     ```
     list_id: [paste the list ID from step 2]
     word: こんにちは
     reading: konnichiwa
     meaning: Hello
     image_url: https://via.placeholder.com/400x300?text=Hello
     pronunciation_url: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
     examples: ["こんにちは、田中さん", "こんにちは、元気ですか？", "こんにちは world", "Morning greeting", "Standard hello"]
     ```
   - Repeat for more words

### 4. Run the Application

```bash
npm run dev
```

Open http://localhost:3000

### 5. Test the App

1. **Sign Up:**
   - Go to http://localhost:3000
   - Click "Sign up"
   - Enter email and password
   - Check your email for verification (or check Supabase Auth settings to disable email confirmation for development)

2. **Login:**
   - Use your credentials to log in

3. **Browse Words:**
   - You should see your sample words on the homepage
   - Click on a word to see details
   - Use filters to organize words

4. **Take a Quiz:**
   - Click "Start Quiz"
   - Choose quiz type and duration
   - Test your knowledge!

## Troubleshooting

### "Invalid API key"
- Double-check your Supabase URL and anon key in `.env.local`
- Make sure there are no extra spaces
- Restart the dev server after changing `.env.local`

### "No words appearing"
- Make sure you've added words to the database
- Check that the `list_id` in words matches an existing list
- Check browser console for errors

### "Can't sign up/login"
- Check Supabase Authentication settings
- For development, you may want to disable email confirmation:
  - Supabase Dashboard > Authentication > Providers > Email
  - Disable "Confirm email"

### Images not loading
- Make sure image URLs are valid
- For testing, use placeholder images: https://via.placeholder.com/400x300
- For production, upload to Cloudinary or similar service

## Next Steps

### Add Real Content

1. **Get Quality Images:**
   - Use Cloudinary for image hosting
   - Search for Japanese vocabulary images
   - Upload and get URLs

2. **Add Audio Pronunciation:**
   - Use Google Cloud Text-to-Speech
   - Or record yourself
   - Upload to Cloudinary
   - Add URLs to database

3. **Create More Lists:**
   - Add different categories
   - Organize words by difficulty
   - Create themed collections

### Customize

1. **Change Colors:**
   - Edit Tailwind classes in components
   - Modify `tailwind.config.js` for custom colors

2. **Add Features:**
   - More quiz types
   - Leaderboards
   - Social sharing
   - Custom user lists

### Deploy

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to vercel.com
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## Need Help?

Check the main README.md for more detailed information or open an issue on GitHub.

Happy learning! 🎉
