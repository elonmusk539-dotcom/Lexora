# 🚀 Quick Start Checklist

Use this checklist to get Lexora up and running quickly!

## ✅ Setup Tasks

### Phase 1: Initial Setup (15 minutes)

- [ ] **1. Dependencies Installed**
  - All npm packages are already installed
  - Run `npm install` if you clone this repo fresh

- [ ] **2. Supabase Project Created**
  - Go to [supabase.com](https://supabase.com)
  - Create new project
  - Note down: Project URL and anon key

- [ ] **3. Environment Variables Set**
  - Open `.env.local`
  - Replace placeholders with your Supabase credentials:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    ```

- [ ] **4. Database Schema Applied**
  - Open Supabase SQL Editor
  - Copy contents of `lib/supabase/schema.sql`
  - Run the SQL
  - Verify tables created: `vocabulary_lists`, `vocabulary_words`, `user_progress`

### Phase 2: Add Content (20 minutes)

- [ ] **5. Create Vocabulary List**
  - In Supabase Table Editor
  - Open `vocabulary_lists` table
  - Insert a new row:
    ```
    name: "Common Japanese Words"
    description: "Basic everyday vocabulary"
    language: "japanese"
    ```
  - Copy the generated `id`

- [ ] **6. Add Sample Words**
  - Open `vocabulary_words` table
  - Insert at least 5 words for testing
  - Use the list ID from step 5
  - Example word:
    ```
    list_id: [paste your list ID]
    word: こんにちは
    reading: konnichiwa
    meaning: Hello
    image_url: https://via.placeholder.com/400x300?text=Hello
    pronunciation_url: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
    examples: ["こんにちは、田中さん", "こんにちは、元気ですか？", "Hello example 3", "Hello example 4", "Hello example 5"]
    ```

### Phase 3: Test Application (10 minutes)

- [ ] **7. Start Dev Server**
  ```bash
  npm run dev
  ```
  - Should start without errors
  - Open http://localhost:3000

- [ ] **8. Test Authentication**
  - Click "Sign up"
  - Create test account
  - Check email for confirmation (or disable in Supabase)
  - Login with credentials

- [ ] **9. Test Core Features**
  - [ ] Home page shows your words
  - [ ] Click a word → details modal opens
  - [ ] Click audio icon → pronunciation plays
  - [ ] Test filters (All, Started, etc.)
  - [ ] Click "Lists" → see your list
  - [ ] Click "Start Quiz" → quiz selection page loads

### Phase 4: Customize (Optional - 30 minutes)

- [ ] **10. Add More Words**
  - Add 20-30 words for better testing
  - Create multiple lists
  - Organize by difficulty/category

- [ ] **11. Add Real Images**
  - Sign up for Cloudinary (free)
  - Upload word images
  - Replace placeholder URLs

- [ ] **12. Add Audio Pronunciation**
  - Use Google Text-to-Speech or similar
  - Upload audio files
  - Update pronunciation URLs

## 🎯 Success Criteria

Your app is ready when you can:

✅ Sign up and login  
✅ See words on homepage  
✅ Click word to view details  
✅ Play audio pronunciation  
✅ Filter words successfully  
✅ Navigate between pages  
✅ No errors in console  

## 🚨 Common Issues & Quick Fixes

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Check `.env.local` credentials, restart dev server |
| No words showing | Add words to database, check `list_id` matches |
| Can't sign up | Check Supabase Auth settings, disable email confirmation for dev |
| Images not loading | Use placeholder URLs first: `https://via.placeholder.com/400x300` |
| Build errors | Run `npm install`, check for TypeScript errors |

## 📚 Next Steps After Setup

1. **Add More Content**
   - Expand vocabulary database
   - Create themed lists
   - Add quality images

2. **Implement Quiz Logic**
   - Build MCQ quiz functionality
   - Create flashcard mode
   - Add results page

3. **Deploy to Production**
   - Push to GitHub
   - Deploy on Vercel
   - Share with users!

## 🆘 Need Help?

1. Check `SETUP.md` for detailed instructions
2. Review `README.md` for comprehensive docs
3. Check `PROJECT-SUMMARY.md` for overview
4. See `DEPLOYMENT.md` for hosting guide

## ⏱️ Time Estimates

- **Minimal Setup**: 15 minutes
  - Just enough to see the app running

- **Full Setup**: 45 minutes
  - With sample data and testing

- **Production Ready**: 2-3 hours
  - With real content and images

## 🎓 Learning Path

New to any of these technologies?

1. **Next.js**: [nextjs.org/learn](https://nextjs.org/learn)
2. **Supabase**: [supabase.com/docs](https://supabase.com/docs)
3. **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
4. **TypeScript**: [typescriptlang.org/docs](https://typescriptlang.org/docs)

## 📝 Notes

- Use placeholder URLs initially for testing
- Start with 5-10 words, expand later
- Test thoroughly before deploying
- Keep your `.env.local` file secure

---

## 🎉 Ready to Begin?

Start with **Phase 1** and check off items as you complete them!

Once all checkboxes are ticked, you'll have a working vocabulary learning app! 🚀

Good luck and happy coding! 💙
