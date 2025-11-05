import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Sidebar } from '@/components/Sidebar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    locale: "en_US",
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
    <html lang="en" suppressHydrationWarning>
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
