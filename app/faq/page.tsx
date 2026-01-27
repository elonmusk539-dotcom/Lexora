'use client';

import Link from 'next/link';
import { Brain, Target, Calendar, Zap, Award, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-ocean-500 to-ocean-600 rounded-2xl mb-4 shadow-glow">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-[var(--color-text-muted)]">
            Everything you need to know about Lexora&apos;s quiz modes
          </p>
        </div>

        <div className="space-y-8">
          {/* What is Spaced Repetition */}
          <div className="card p-4 sm:p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                  What is Spaced Repetition?
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-3">
                  Spaced repetition is a scientifically-proven learning technique that optimizes when you review information.
                  Instead of cramming all at once, you review material at increasing intervals just before you&apos;re likely to forget it.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Lexora uses the <strong>SuperMemo 2 (SM-2) algorithm</strong>, which automatically adjusts review intervals
                  based on how well you remember each word. The better you know a word, the less frequently you&apos;ll see it.
                </p>
              </div>
            </div>
          </div>

          {/* Normal Quiz vs Smart Quiz */}
          <div className="card p-4 sm:p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-ocean-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                  Normal Quiz vs Smart Quiz
                </h2>

                <div className="space-y-4">
                  <div className="border-l-4 border-[var(--color-accent-primary)] pl-4">
                    <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-2">
                      Normal Quiz
                    </h3>
                    <ul className="space-y-2 text-[var(--color-text-secondary)]">
                      <li>• Choose between MCQ or Flashcard format</li>
                      <li>• Random selection from your chosen lists</li>
                      <li>• Simple right/wrong scoring</li>
                      <li>• Best for casual practice and exploration</li>
                      <li>• Each correct answer increases progress by 1, each wrong answer decreases it by 1</li>
                      <li>• Words are mastered when progress reaches <strong>7</strong></li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-coral-500 pl-4">
                    <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-2">
                      Smart Quiz (Spaced Repetition)
                    </h3>
                    <ul className="space-y-2 text-[var(--color-text-secondary)]">
                      <li>• Always uses flashcard format for better recall</li>
                      <li>• Prioritizes words that are due for review</li>
                      <li>• 4-level rating system (Again, Hard, Good, Easy)</li>
                      <li>• Automatically schedules next review based on your performance</li>
                      <li>• Best for long-term retention and serious learning</li>
                      <li>• Words are mastered after consistent successful reviews (see mastery criteria below)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How does the rating system work */}
          <div className="card p-4 sm:p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                  How does the rating system work?
                </h2>

                <p className="text-[var(--color-text-secondary)] mb-4">
                  In Smart Quiz, you rate how well you remembered each word using one of four buttons:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-bold text-red-600 dark:text-red-400">Again:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      You didn&apos;t remember the word at all. It will be shown again soon (within 1 day).
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="font-bold text-orange-600 dark:text-orange-400">Hard:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      You remembered it, but with difficulty. Review interval increases slightly.
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-bold text-green-600 dark:text-green-400">Good:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      You remembered it correctly with some effort. Standard interval increase.
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Easy:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      You remembered it instantly and effortlessly. Maximum interval increase.
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 italic">
                  💡 Tip: Be honest with your ratings! The algorithm works best when you accurately reflect your recall ability.
                </p>
              </div>
            </div>
          </div>

          {/* When is a word mastered */}
          <div className="card p-4 sm:p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-coral-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                  When is a word considered mastered?
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                      In Normal Quiz:
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      Each word has a progress number that changes based on your answers:
                    </p>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4 mb-2">
                      <li>• <strong>Correct answer:</strong> Progress increases by 1</li>
                      <li>• <strong>Wrong answer:</strong> Progress decreases by 1 (minimum 0)</li>
                      <li>• <strong>Mastered:</strong> When progress reaches 7</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                      Example: If a word&apos;s progress is at 5 and you answer it correctly, it becomes 6. One more correct answer will master it!
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                      In Smart Quiz (Spaced Repetition):
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      A word is mastered when you&apos;ve demonstrated consistent retention over time:
                    </p>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• You&apos;ve successfully reviewed it at least <strong>7 times</strong></li>
                      <li>• Your <strong>ease factor</strong> is at least <strong>2.5</strong></li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 italic">
                      The ease factor (starting at 2.5) measures how well you remember the word. It increases when you rate words as &quot;Good&quot; or &quot;Easy&quot; and decreases when you rate them as &quot;Again&quot; or &quot;Hard&quot;. A higher ease factor means longer intervals between reviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How are review dates calculated */}
          <div className="card p-4 sm:p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                  How are review dates calculated?
                </h2>

                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Smart Quiz uses the <strong>SuperMemo 2 (SM-2) algorithm</strong> to determine when you should review each word:
                </p>

                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4 mb-4">
                  <li>• <strong>First review:</strong> 1 day after learning</li>
                  <li>• <strong>Second review:</strong> 6 days after the first review</li>
                  <li>• <strong>Subsequent reviews:</strong> Interval = Previous interval × Ease factor</li>
                </ul>

                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  When you rate a word, it affects when you&apos;ll see it next:
                </p>

                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Again:</strong> You forgot the word. Next review in 1 day. Ease factor decreases (making future intervals shorter).</li>
                  <li>• <strong>Hard:</strong> You remembered with difficulty. Next interval slightly longer (×1.2). Ease factor decreases slightly.</li>
                  <li>• <strong>Good:</strong> You remembered correctly. Next interval = Previous interval × Ease factor. Ease factor stays the same.</li>
                  <li>• <strong>Easy:</strong> You remembered instantly. Next interval significantly longer (×1.3 of what &quot;Good&quot; would give). Ease factor increases.</li>
                </ul>

                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Example:</strong> Let&apos;s say a word has an ease factor of 2.5 and was last reviewed 6 days ago.
                  </p>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                    <li>• Rate <strong>Again</strong>: Next review in 1 day</li>
                    <li>• Rate <strong>Hard</strong>: Next review in ~7 days (6 × 1.2)</li>
                    <li>• Rate <strong>Good</strong>: Next review in 15 days (6 × 2.5)</li>
                    <li>• Rate <strong>Easy</strong>: Next review in ~20 days (6 × 2.5 × 1.3)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="card p-4 sm:p-6 md:p-8 bg-gradient-to-r from-ocean-500/10 to-teal-500/10">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              💡 Tips for Effective Learning
            </h2>

            <ul className="space-y-3 text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <span><strong>Use both modes:</strong> Start with Normal Quiz to familiarize yourself with new words, then switch to Smart Quiz for long-term retention.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <span><strong>Review daily:</strong> Check the Smart Quiz badge in the sidebar to see how many words are due for review today.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎭</span>
                <span><strong>Be honest:</strong> Don&apos;t mark a word as &quot;Easy&quot; if you struggled. Accurate ratings help the algorithm schedule reviews at the perfect time.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <span><strong>Stay consistent:</strong> Regular practice with spaced repetition is more effective than long, infrequent study sessions.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <span><strong>Track progress:</strong> Check your profile to see your learning statistics and mastered words.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 btn-primary font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
