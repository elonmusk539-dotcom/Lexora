# Lexora - Vocabulary Learning App

A beautiful, modern vocabulary learning application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Authentication** - Secure login and signup with Supabase
- 📚 **Word Management** - Browse and study vocabulary with visual images
- 🎯 **Smart Quizzes** - Multiple choice and flashcard-style quizzes
- 📊 **Progress Tracking** - Simple streak-based mastery system (7 correct answers = mastery)
- 🎨 **Beautiful UI** - Clean, elegant interface with smooth animations
- 🔊 **Pronunciation** - Audio pronunciation for every word
- 🏷️ **Lists** - Organize vocabulary into categorized collections
- 📈 **Results** - Detailed post-quiz feedback showing progress updates

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Lexora
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. Configure environment variables:
   - Rename `.env.local` to `.env.local` if needed
   - Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Set up the database:
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL script from `lib/supabase/schema.sql`
   - This will create all necessary tables and policies

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Adding Sample Data

You can add vocabulary words manually through the Supabase dashboard:

1. Go to Table Editor in Supabase
2. Add entries to `vocabulary_lists` first
3. Then add words to `vocabulary_words` with:
   - word (Japanese text)
   - reading (romanization)
   - meaning (English translation)
   - image_url (Cloudinary URL)
   - pronunciation_url (audio file URL)
   - examples (array of 5 example sentences)

## Project Structure

```
Lexora/
├── app/
│   ├── page.tsx              # Home page with word list
│   ├── login/                # Authentication pages
│   ├── signup/
│   ├── lists/                # Vocabulary lists
│   ├── quiz/                 # Quiz pages
│   └── layout.tsx
├── components/
│   ├── CircularProgress.tsx  # Progress indicator
│   ├── WordDetailsCard.tsx   # Word detail modal
│   └── WordListItem.tsx      # Word list component
├── lib/
│   └── supabase/
│       ├── client.ts         # Supabase client setup
│       ├── types.ts          # TypeScript types
│       └── schema.sql        # Database schema
└── public/                   # Static assets
```

## How to Use

### For Users

1. **Sign Up/Login** - Create an account or login
2. **Browse Words** - View all vocabulary on the homepage
3. **Filter Words** - Use filters to view:
   - All words
   - In progress (started learning)
   - Not started
   - Mastered words
4. **View Details** - Click any word to see details, image, and examples
5. **Take Quizzes** - Click "Start Quiz" to begin learning
6. **Track Progress** - Your progress is automatically saved

### Progress System

- Each correct answer: +1 to streak
- Each wrong answer: -1 from streak (minimum 0)
- Reach streak of 7: Word is mastered! 🎉
- Progress shown as circular percentage indicator

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Your app will be live at `your-app.vercel.app`

## Future Enhancements

- [ ] Spaced repetition algorithm
- [ ] More languages (currently Japanese)
- [ ] Audio recording for pronunciation practice
- [ ] Social features (share lists, compete with friends)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Custom word lists creation by users
- [ ] AI-powered example sentences

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or personal use.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase
