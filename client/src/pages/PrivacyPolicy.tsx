import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/profile">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6" data-testid="button-back">
            <ArrowLeft size={20} />
            Back to Profile
          </button>
        </Link>

        <main className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: October 29, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
            <p className="text-foreground mb-4">
              Pally Predict ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our prediction game platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Information You Provide</h3>
            <p className="text-foreground mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Account information (username/handle, profile details)</li>
              <li>Authentication credentials (managed through Privy)</li>
              <li>Wallet addresses (if you choose to connect a wallet)</li>
              <li>Email addresses (if you use email authentication)</li>
              <li>Social media profile information (if you use social login)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-foreground">2.2 Information Automatically Collected</h3>
            <p className="text-foreground mb-4">When you use our service, we automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Voting history and prediction choices</li>
              <li>Alpha points, streaks, and badge achievements</li>
              <li>Session information and usage patterns</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP addresses and location data</li>
              <li>Timestamps of your interactions with the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
            <p className="text-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your predictions and calculate points</li>
              <li>Display leaderboards and user rankings</li>
              <li>Authenticate your identity and maintain account security</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
              <li>Communicate with you about the service, updates, and announcements</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-foreground">4.1 Public Information</h3>
            <p className="text-foreground mb-4">
              The following information is publicly visible to other users:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Your username/handle</li>
              <li>Your total Alpha points and leaderboard ranking</li>
              <li>Your public votes (if you choose public voting mode)</li>
              <li>Your badges, streaks, and achievements</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-foreground">4.2 Private Information</h3>
            <p className="text-foreground mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>With service providers who perform services on our behalf (e.g., Privy for authentication, hosting providers)</li>
              <li>To comply with legal obligations, court orders, or government requests</li>
              <li>To protect our rights, property, or safety, or that of our users or the public</li>
              <li>In connection with a merger, acquisition, or sale of assets (with notice to affected users)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Third-Party Services</h2>
            <p className="text-foreground mb-4">
              We use Privy for authentication services. Privy's handling of your authentication data is governed by their own privacy policy. We encourage you to review Privy's privacy policy to understand how they collect and use your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Security</h2>
            <p className="text-foreground mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Data Retention</h2>
            <p className="text-foreground mb-4">
              We retain your personal information for as long as your account is active or as needed to provide you services. We may retain certain information after account deletion as required by law or for legitimate business purposes, such as fraud prevention and enforcing our agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Your Rights and Choices</h2>
            <p className="text-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Access and update your account information</li>
              <li>Choose between public and private voting modes</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of certain data collection (which may limit service functionality)</li>
              <li>Request a copy of your personal data</li>
            </ul>
            <p className="text-foreground mb-4">
              To exercise these rights, please contact us through our support channels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Children's Privacy</h2>
            <p className="text-foreground mb-4">
              Pally Predict is not intended for users under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If we become aware that we have collected information from a child without appropriate consent, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. International Data Transfers</h2>
            <p className="text-foreground mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our service, you consent to such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Cookies and Tracking</h2>
            <p className="text-foreground mb-4">
              We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookies through your browser settings, but disabling cookies may limit some functionality of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Changes to This Privacy Policy</h2>
            <p className="text-foreground mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date and, where appropriate, by other means such as email or in-app notifications. Your continued use of the service after changes become effective constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Contact Us</h2>
            <p className="text-foreground mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us through our support channels.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
