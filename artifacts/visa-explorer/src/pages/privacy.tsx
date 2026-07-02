import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const EFFECTIVE_DATE = "1 July 2026";
const CONTACT_EMAIL = "collabrintegration@gmail.com";
const APP_NAME = "Visagram";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/60">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Visagram</title>
        <meta name="description" content="Visagram Privacy Policy — how we collect, use, and protect your personal data." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/60 bg-card/30">
          <div className="container mx-auto px-4 py-10 max-w-3xl">
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Visagram
              </span>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-muted-foreground text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed bg-card border border-border rounded-xl p-4">
            This Privacy Policy explains how {APP_NAME} collects, uses, shares, and protects your personal
            information when you use our platform. By using {APP_NAME} you consent to the practices described
            here. Read our{" "}
            <Link href="/terms">
              <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
            </Link>{" "}
            for the full rules governing use of the platform.
          </p>

          <Section title="1. Information We Collect">
            <p><strong className="text-foreground">Account information</strong> — When you sign in via Replit OAuth we receive your name, email address, profile image, and username.</p>
            <p><strong className="text-foreground">Profile information you provide</strong> — Bio, home country, location, date of birth, gender, travel map entries (visited / wishlist countries), and any profile picture you upload.</p>
            <p><strong className="text-foreground">Content you create</strong> — Visa reviews, travel questions and answers, group posts and messages, direct messages to other users, and any photos you upload.</p>
            <p><strong className="text-foreground">Usage data</strong> — Pages visited, features used, search queries, clicks, session duration, device type, browser, operating system, and IP address.</p>
            <p><strong className="text-foreground">Communications</strong> — If you contact us by email, we retain those communications.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Provide and operate the platform</strong> — display your profile, feed, travel map, visa tracker, groups, and messages.</li>
              <li><strong className="text-foreground">Personalise your experience</strong> — show relevant content, country suggestions, and community recommendations.</li>
              <li><strong className="text-foreground">Analytics and product improvement</strong> — understand how the platform is used, identify popular features, and fix issues. This includes aggregated and de-identified analysis of user behaviour, content trends, and travel data.</li>
              <li><strong className="text-foreground">Safety and moderation</strong> — detect abuse, spam, and violations of our Terms of Service.</li>
              <li><strong className="text-foreground">Communications</strong> — send service notifications (friend requests, messages, account alerts).</li>
              <li><strong className="text-foreground">Legal compliance</strong> — meet our legal obligations and respond to lawful requests.</li>
            </ul>
          </Section>

          <Section title="3. Analytics and Data Insights">
            <p>
              We use your activity and Content on {APP_NAME} to generate analytics insights. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Understanding which countries, visa routes, and topics are most discussed.</li>
              <li>Measuring engagement with reviews, Q&amp;A, and community features.</li>
              <li>Tracking travel trends across our user base.</li>
              <li>Improving search, recommendations, and content ranking.</li>
            </ul>
            <p>
              Analytics data is typically processed in aggregated or de-identified form. Where individual-level
              data is used internally, it is subject to appropriate access controls.
            </p>
            <p>
              We may use third-party analytics services (e.g. web analytics providers) that process usage data
              on our behalf under data processing agreements. These providers are not permitted to use your data
              for their own purposes.
            </p>
          </Section>

          <Section title="4. Sharing Your Information">
            <p>We do not sell your personal information. We may share it in these circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Service providers</strong> — hosting, analytics, email, and infrastructure providers acting on our behalf under confidentiality obligations.
              </li>
              <li>
                <strong className="text-foreground">Travel partners</strong> — with your consent, we may share relevant travel-preference data with partners offering travel-related services (visa agencies, insurance, booking platforms).
              </li>
              <li>
                <strong className="text-foreground">Aggregated insights</strong> — anonymised, aggregated data (e.g. "most-visited countries by Indian passport holders") may be shared publicly or with research/media partners.
              </li>
              <li>
                <strong className="text-foreground">Legal requirements</strong> — when required by law, regulation, court order, or governmental authority.
              </li>
              <li>
                <strong className="text-foreground">Safety</strong> — to prevent fraud, protect {APP_NAME} or its users, or respond to security incidents.
              </li>
              <li>
                <strong className="text-foreground">Business transfer</strong> — in connection with a merger, acquisition, financing, or sale of assets, where your data may be transferred as a business asset.
              </li>
            </ul>
            <p>
              <strong className="text-foreground">Public content</strong>: Reviews, questions, answers, and group posts you mark as public are visible to all visitors and may be indexed by search engines or shared by other users.
            </p>
          </Section>

          <Section title="5. Your Choices and Rights">
            <p>Depending on your location, you may have certain rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Correction</strong> — update inaccurate information via your profile settings.</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and personal data. Note that Content you've shared publicly (reviews, questions) may remain in anonymised form.</li>
              <li><strong className="text-foreground">Objection / restriction</strong> — object to or request restriction of certain processing activities.</li>
              <li><strong className="text-foreground">Data portability</strong> — request your data in a machine-readable format.</li>
              <li><strong className="text-foreground">Withdraw consent</strong> — where processing is based on consent, you may withdraw it at any time (this does not affect prior processing).</li>
            </ul>
            <p>
              To exercise these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the
              service. After account deletion we may retain anonymised or aggregated data indefinitely for
              analytics and research purposes. Some data may be retained longer if required by law.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              We implement industry-standard technical and organisational measures to protect your data,
              including encrypted connections (HTTPS), access controls, and secure credential handling via
              OAuth. No method of transmission over the Internet is completely secure; we cannot guarantee
              absolute security.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              {APP_NAME} is not directed to children under 13. We do not knowingly collect personal data
              from children under 13. If we become aware that we have collected data from a child under 13,
              we will delete it promptly. If you believe a child under 13 has provided us with their data,
              please contact us.
            </p>
          </Section>

          <Section title="9. International Data Transfers">
            <p>
              {APP_NAME} operates globally. Your data may be stored and processed in countries outside your
              home country, which may have different data protection laws. By using {APP_NAME} you consent
              to such transfers. We take steps to ensure appropriate safeguards are in place where required
              by applicable law.
            </p>
          </Section>

          <Section title="10. Cookies and Tracking">
            <p>
              We use cookies and similar technologies to maintain your session, remember preferences, and
              collect usage analytics. Session cookies are essential for authentication. Analytics cookies
              help us understand platform usage. You can control cookies through your browser settings,
              though disabling them may affect functionality.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes by
              posting a notice on the platform or by email. Continued use after the effective date constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              Questions, concerns, or data requests? Contact our privacy team at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/terms">
              <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
            </Link>
            <span>·</span>
            <Link href="/">
              <span className="hover:text-foreground cursor-pointer transition-colors">Back to {APP_NAME}</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
