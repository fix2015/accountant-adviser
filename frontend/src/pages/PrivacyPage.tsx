import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ds-bg-primary">
      <Header />
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-ds-text-primary mb-2">Privacy Policy</h1>
          <p className="text-sm text-ds-text-muted mb-10">Last updated: January 2026</p>

          <div className="space-y-8 text-sm text-ds-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">1. Introduction</h2>
              <p>
                AI Accountant Adviser ("we", "us", "our") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, store, and protect your personal
                data when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">2. Data We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-ds-text-primary">Account information:</strong> Name, email address, and hashed password.</li>
                <li><strong className="text-ds-text-primary">Payment information:</strong> Processed securely by Stripe. We do not store card details.</li>
                <li><strong className="text-ds-text-primary">Documents:</strong> Financial documents you upload for analysis (PDF, DOC, TXT, CSV, etc.).</li>
                <li><strong className="text-ds-text-primary">Chat history:</strong> Conversations with the AI adviser.</li>
                <li><strong className="text-ds-text-primary">Usage data:</strong> Pages visited, features used, and session information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">3. How We Use Your Data</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide and improve the AI tax consultation service.</li>
                <li>To analyse your documents and generate personalised tax strategies.</li>
                <li>To build and maintain your knowledge graph.</li>
                <li>To process payments and manage your account.</li>
                <li>To communicate with you about your consultation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">4. Data Storage and Security</h2>
              <p>
                Your documents and data are stored encrypted on <strong className="text-ds-text-primary">Amazon Web Services (AWS)</strong> in
                the EU-West-2 (London) region. We use industry-standard encryption (AES-256) for data
                at rest and TLS 1.3 for data in transit. Access to data is strictly controlled and
                monitored.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">5. Data Sharing</h2>
              <p>
                We do not sell, rent, or share your personal data with third parties except:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Stripe for payment processing.</li>
                <li>AWS for secure cloud storage.</li>
                <li>When required by law or legal proceedings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">6. Your Rights (GDPR)</h2>
              <p>Under the UK GDPR and Data Protection Act 2018, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-ds-text-primary">Access</strong> your personal data.</li>
                <li><strong className="text-ds-text-primary">Rectify</strong> inaccurate data.</li>
                <li><strong className="text-ds-text-primary">Erase</strong> your data ("right to be forgotten").</li>
                <li><strong className="text-ds-text-primary">Restrict</strong> processing of your data.</li>
                <li><strong className="text-ds-text-primary">Data portability</strong> - receive your data in a portable format.</li>
                <li><strong className="text-ds-text-primary">Object</strong> to processing based on legitimate interests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">7. Right to Deletion</h2>
              <p>
                You can request complete deletion of all your data, including documents, chat history,
                and account information, at any time by emailing{" "}
                <a href="mailto:support@aiaccountant.co.uk" className="text-ds-text-accent hover:underline">
                  support@aiaccountant.co.uk
                </a>
                . We will process your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">8. Cookies</h2>
              <p>
                We use essential cookies for authentication and session management. Analytical cookies
                may be used to understand how the Service is used. You can manage your preferences
                through the cookie consent banner displayed on first visit.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">9. Data Retention</h2>
              <p>
                We retain your data for the duration of your account. Upon account deletion or
                erasure request, all data is permanently removed within 30 days. Anonymised,
                aggregated statistics may be retained for service improvement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ds-text-primary mb-3">10. Contact</h2>
              <p>
                For privacy-related queries or to exercise your rights, contact our Data Protection
                Officer at{" "}
                <a href="mailto:privacy@aiaccountant.co.uk" className="text-ds-text-accent hover:underline">
                  privacy@aiaccountant.co.uk
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
