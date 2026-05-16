import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Sidebar } from '@/components/Sidebar';

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lexora - Learn Japanese Vocabulary",
  description: "Learn Japanese vocabulary with a clean and minimal vocab learning app. Master words with images, examples, flashcards, and interactive quizzes.",
  keywords: ["Japanese", "vocabulary", "learning", "flashcards", "quiz", "kanji", "hiragana", "study"],
  authors: [{ name: "Lexora" }],
  openGraph: {
    title: "Lexora - Learn Japanese Vocabulary",
    description: "Learn Japanese vocabulary with a clean and minimal vocab learning app with images, examples, and interactive quizzes!",
    type: "website",
    locale: "ja_JP",
    siteName: "Lexora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lexora - Learn Japanese Vocabulary",
    description: "Learn Japanese vocabulary with a clean and minimal vocab learning app with images, examples, and interactive quizzes!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const theme = stored === 'dark' || stored === 'light'
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

                  const applyTheme = (nextTheme) => {
                    const root = document.documentElement;
                    const body = document.body;
                    const isDark = nextTheme === 'dark';

                    // Explicitly remove dark class from both root and body
                    root.classList.remove('dark');
                    if (body) body.classList.remove('dark');
                    
                    // Add dark class only if theme is dark
                    if (isDark) {
                      root.classList.add('dark');
                      if (body) body.classList.add('dark');
                    }

                    root.setAttribute('data-theme', nextTheme);
                    root.setAttribute('data-mode', nextTheme);
                    root.style.colorScheme = nextTheme;
                  };

                  applyTheme(theme);

                  if (!document.body) {
                    document.addEventListener('DOMContentLoaded', function onReady() {
                      document.removeEventListener('DOMContentLoaded', onReady);
                      applyTheme(theme);
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${notoSansJP.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Sidebar>
            {children}
          </Sidebar>
        </ThemeProvider>
      </body>
    </html>
  );
}
