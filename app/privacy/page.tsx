import { Waves } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Lexora',
  description: 'Privacy Policy for Lexora - Japanese Vocabulary Learning App',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Lexora</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
            Privacy Policy
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Last updated: February 13, 2026
          </p>
        </div>

        {/* Content */}
        <div className="card-elevated p-6 sm:p-8 space-y-8 text-[var(--color-text-secondary)] leading-relaxed">

          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              1. Introduction
            </h2>
            <p>
              Lexora (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a Japanese vocabulary learning application
              available on the web and as a mobile application on Android. We are committed to
              protecting your privacy and handling your personal data responsibly. This Privacy
              Policy explains what information we collect, how we use it, who we share it with,
              and your rights regarding your data.
            </p>
            <p className="mt-3">
              By using Lexora, you agree to the collection and use of information in accordance
              with this policy. If you do not agree, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mt-4 mb-2">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Account Information:</strong> When you sign up using Google OAuth, we
                receive your name, email address, and profile picture from Google.
              </li>
              <li>
                <strong>Profile Information:</strong> Username and display preferences you set
                in your profile settings.
              </li>
              <li>
                <strong>User-Generated Content:</strong> Custom vocabulary words, personal word
                lists, and notes you create within the app.
              </li>
              <li>
                <strong>Settings &amp; Preferences:</strong> Your quiz settings, theme preferences,
                and study configuration choices.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mt-4 mb-2">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Learning Progress:</strong> Quiz scores, mastery levels, correct/incorrect
                streaks, review history, and study session data used to personalize your
                learning experience.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, and interaction
                patterns to improve our service.
              </li>
              <li>
                <strong>Device Information:</strong> Device type, operating system version, and
                browser/WebView type for compatibility and performance optimization.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mt-4 mb-2">
              2.3 Information We Do NOT Collect
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>We do not collect your precise location data.</li>
              <li>We do not access your contacts, camera, microphone, or files on your device.</li>
              <li>We do not collect financial information directly — all payments are handled by Google Play.</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Provide, maintain, and improve the Lexora service.</li>
              <li>Authenticate your identity and manage your account.</li>
              <li>Track your vocabulary learning progress and mastery levels.</li>
              <li>Personalize your study experience with smart review and spaced repetition.</li>
              <li>Manage your subscription status (Free or Pro tiers).</li>
              <li>Respond to your feedback, questions, or support requests.</li>
              <li>Detect and prevent fraud or abuse of our services.</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              4. Third-Party Services
            </h2>
            <p className="mb-3">
              Lexora uses the following third-party services that may collect data as described
              in their own privacy policies:
            </p>

            <div className="space-y-4">
              <div className="p-4 glass rounded-xl">
                <h4 className="font-semibold text-[var(--color-text-primary)]">Supabase</h4>
                <p className="text-sm mt-1">
                  Used for user authentication, database storage, and backend services.
                  Your account data, vocabulary, and progress are stored securely on Supabase
                  servers. All data is encrypted in transit via HTTPS.
                </p>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[var(--color-accent-primary)] mt-1 inline-block">
                  Supabase Privacy Policy →
                </a>
              </div>

              <div className="p-4 glass rounded-xl">
                <h4 className="font-semibold text-[var(--color-text-primary)]">Google OAuth</h4>
                <p className="text-sm mt-1">
                  Used for sign-in authentication. We receive your name, email, and profile
                  picture from Google when you sign in. We do not access any other Google account data.
                </p>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[var(--color-accent-primary)] mt-1 inline-block">
                  Google Privacy Policy →
                </a>
              </div>

              <div className="p-4 glass rounded-xl">
                <h4 className="font-semibold text-[var(--color-text-primary)]">RevenueCat</h4>
                <p className="text-sm mt-1">
                  Used to manage in-app subscriptions (Lexora Pro) on Android via Google Play
                  Billing. RevenueCat processes your subscription status but does not access
                  your payment details — those are handled entirely by Google Play.
                </p>
                <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[var(--color-accent-primary)] mt-1 inline-block">
                  RevenueCat Privacy Policy →
                </a>
              </div>

              <div className="p-4 glass rounded-xl">
                <h4 className="font-semibold text-[var(--color-text-primary)]">Vercel</h4>
                <p className="text-sm mt-1">
                  Our web application is hosted on Vercel. Vercel may collect standard web
                  server logs including IP addresses and request metadata.
                </p>
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[var(--color-accent-primary)] mt-1 inline-block">
                  Vercel Privacy Policy →
                </a>
              </div>
            </div>
          </section>

          {/* Data Storage & Security */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              5. Data Storage &amp; Security
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>All data is transmitted over encrypted connections (HTTPS/TLS).</li>
              <li>Your data is stored securely on Supabase infrastructure with row-level security policies ensuring users can only access their own data.</li>
              <li>Passwords are never stored by Lexora — authentication is handled entirely via Google OAuth.</li>
              <li>We implement industry-standard security measures to protect your data, but no method of electronic transmission or storage is 100% secure.</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              6. Data Sharing
            </h2>
            <p>We do NOT sell, rent, or trade your personal data to third parties.</p>
            <p className="mt-2">We may share your data only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>
                <strong>Service Providers:</strong> With the third-party services listed above,
                solely to provide and improve Lexora&apos;s functionality.
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law, regulation, legal process,
                or governmental request.
              </li>
              <li>
                <strong>Safety:</strong> To protect the rights, property, or safety of Lexora,
                our users, or others.
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              7. Your Rights &amp; Choices
            </h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>
                <strong>Access:</strong> You can view all your personal data, vocabulary,
                and progress within the app at any time.
              </li>
              <li>
                <strong>Correction:</strong> You can update your profile information and
                settings through the app.
              </li>
              <li>
                <strong>Deletion:</strong> You can request complete deletion of your account
                and all associated data by contacting us at the email below. We will process
                deletion requests within 30 days.
              </li>
              <li>
                <strong>Data Export:</strong> You can request a copy of your data by contacting us.
              </li>
              <li>
                <strong>Withdraw Consent:</strong> You can stop using the app at any time. You
                can revoke Google OAuth access from your Google account settings.
              </li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Lexora is not directed at children under the age of 13. We do not knowingly
              collect personal information from children under 13. If we become aware that
              a child under 13 has provided us with personal data, we will take steps to
              delete that information promptly. If you believe a child under 13 is using
              Lexora, please contact us immediately.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              9. Data Retention
            </h2>
            <p>
              We retain your personal data for as long as your account is active or as needed
              to provide you with our services. If you request account deletion, we will delete
              your data within 30 days, except where we are required to retain it for legal
              or regulatory purposes.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting the new policy on this page and updating the
              &quot;Last updated&quot; date. Your continued use of Lexora after changes are posted
              constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy
              or your personal data, please contact us at:
            </p>
            <div className="mt-3 p-4 glass rounded-xl">
              <p className="font-semibold text-[var(--color-text-primary)]">Lexora Support</p>
              <p className="mt-1">
                Email:{' '}
                <a href="mailto:lexoraapp@gmail.com" className="text-[var(--color-accent-primary)]">
                  lexoraapp@gmail.com
                </a>
              </p>
              <p className="mt-1">
                Website:{' '}
                <a href="https://lexora-nu.vercel.app" className="text-[var(--color-accent-primary)]">
                  lexora-nu.vercel.app
                </a>
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
          <p>© 2026 Lexora. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
