import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ScrollText, ArrowLeft } from "lucide-react";

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

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Visagram</title>
        <meta name="description" content="Visagram Terms of Service — the rules, rights, and responsibilities for using our platform." />
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
              <ScrollText className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-muted-foreground text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed bg-card border border-border rounded-xl p-4">
            Please read these Terms of Service carefully before using {APP_NAME}. By creating an account or
            using any part of our platform, you confirm that you have read, understood, and agree to be bound
            by these Terms and our{" "}
            <Link href="/privacy">
              <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
            </Link>
            . If you do not agree, do not use {APP_NAME}.
          </p>

          <Section title="1. Who We Are">
            <p>
              {APP_NAME} ("<strong className="text-foreground">Visagram</strong>", "<strong className="text-foreground">we</strong>", "
              <strong className="text-foreground">us</strong>", "<strong className="text-foreground">our</strong>") is a travel
              information and community platform that helps travelers explore visa requirements, share experiences,
              ask questions, and connect with other travelers worldwide.
            </p>
            <p>
              Our registered contact is: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 13 years of age to use {APP_NAME}. By using our platform you represent that:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are at least 13 years old.</li>
              <li>You have the legal capacity to enter into a binding agreement.</li>
              <li>You are not prohibited from using our services under the laws of your jurisdiction.</li>
            </ul>
          </Section>

          <Section title="3. Your Account">
            <p>
              Authentication is handled via your Replit account (OAuth 2.0 / OIDC). You are responsible for
              all activity that occurs under your account. Do not share your credentials with anyone.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, impersonate others,
              or engage in behaviour that harms the community.
            </p>
          </Section>

          <Section title="4. User-Generated Content">
            <p>
              {APP_NAME} allows you to submit content including travel reviews, visa questions, answers, profile
              information, travel photos, group posts, and messages ("<strong className="text-foreground">Content</strong>").
            </p>
            <p>
              By submitting Content you grant {APP_NAME} a <strong className="text-foreground">worldwide, royalty-free, non-exclusive,
              perpetual, irrevocable, sublicensable licence</strong> to use, reproduce, adapt, publish, translate,
              distribute, display, and create derivative works from your Content for any purpose connected with
              operating and improving the platform — including analytics, marketing, and partner integrations.
            </p>
            <p>
              You represent that: (a) you own or have the right to share your Content; (b) your Content does not
              infringe any third-party rights; and (c) your Content complies with these Terms.
            </p>
            <p>
              {APP_NAME} does not claim ownership of your Content. You retain all ownership rights. We may remove
              Content that violates these Terms at any time without notice.
            </p>
          </Section>

          <Section title="5. Data Collection and Analytics">
            <p>
              By using {APP_NAME} you agree that we may collect, store, process, and analyse data generated by
              your use of the platform, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information (name, email, profile details).</li>
              <li>Content you submit (reviews, questions, answers, travel photos).</li>
              <li>Usage data (pages visited, features used, interactions).</li>
              <li>Device and connection information (browser, IP address, locale).</li>
              <li>Travel preferences and wishlist/visited country data.</li>
            </ul>
            <p>
              We use this data to operate and improve {APP_NAME}, personalise your experience, generate
              aggregated analytics insights, and for internal research. Aggregated, de-identified analytics
              data may be shared with third-party analytics providers or business partners. Please see our{" "}
              <Link href="/privacy">
                <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
              </Link>{" "}
              for full details.
            </p>
          </Section>

          <Section title="6. Data Sharing">
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Service providers</strong> — third parties who help us operate the platform (hosting, analytics, email).</li>
              <li><strong className="text-foreground">Business partners</strong> — with partners for travel-related services you opt into.</li>
              <li><strong className="text-foreground">Legal obligations</strong> — when required by law, court order, or government authority.</li>
              <li><strong className="text-foreground">Safety</strong> — to protect the rights, property, or safety of {APP_NAME}, our users, or the public.</li>
              <li><strong className="text-foreground">Business transfer</strong> — in connection with a merger, acquisition, or sale of assets.</li>
            </ul>
            <p>
              Public Content (reviews, questions, answers) you post is visible to all users and may be
              indexed by search engines.
            </p>
          </Section>

          <Section title="7. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Post false, misleading, or fraudulent visa information.</li>
              <li>Harass, threaten, or abuse other users.</li>
              <li>Upload content that is unlawful, obscene, or infringes third-party rights.</li>
              <li>Attempt to hack, scrape, or interfere with the platform.</li>
              <li>Create fake accounts or impersonate others.</li>
              <li>Use the platform for commercial solicitation without permission.</li>
              <li>Violate any applicable laws or regulations.</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              The {APP_NAME} name, logo, design, software, and curated visa data are the intellectual property
              of {APP_NAME} and its licensors. You may not copy, modify, distribute, or create derivative works
              without our prior written consent.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              Visa requirements change frequently. Information on {APP_NAME} — including user reviews,
              community Q&amp;A, and curated data — is provided for <strong className="text-foreground">informational purposes only</strong> and
              may not be accurate, complete, or up to date. Always verify visa requirements with the official
              embassy or consulate of your destination country before travelling.
            </p>
            <p>
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE
              MAXIMUM EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} DISCLAIMS ALL WARRANTIES INCLUDING
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, {APP_NAME} shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages — including loss of profits,
              data, goodwill, or travel expenses — arising from your use of or inability to use the platform.
            </p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify registered users of material changes
              by posting a notice on the platform or by email. Continued use after the effective date of any
              changes constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any disputes shall
              be resolved in the courts of competent jurisdiction.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              If you have questions about these Terms, please contact us at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy">
              <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
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
