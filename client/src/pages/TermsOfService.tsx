import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-2 text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: October 29, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-foreground mb-4">
              Welcome to Pally Predict ("Pally Arena", "we", "our", or "us"). By accessing or using our prediction game platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
            <p className="text-foreground mb-4">
              Pally Predict is a competitive prediction game where users make daily predictions about various topics to earn Alpha points and compete on leaderboards. The service includes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Daily multiple-choice prediction questions</li>
              <li>Public and private voting modes with different point multipliers</li>
              <li>Alpha points accumulation based on prediction accuracy and rarity</li>
              <li>Leaderboard rankings and seasonal competitions</li>
              <li>User profiles with badges, streaks, and achievement tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts and Authentication</h2>
            <p className="text-foreground mb-4">
              To use Pally Predict, you must create an account using one of our supported authentication methods (wallet, email, or social login via Privy). You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Use only one account per person</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Game Rules and Points</h2>
            <p className="text-foreground mb-4">
              Alpha points are awarded based on the accuracy and rarity of your predictions:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Users may vote once per question</li>
              <li>Public votes earn a ×2 point multiplier; private votes earn ×1</li>
              <li>Correct predictions earn base points inversely proportional to popularity (rarer choices = more points)</li>
              <li>Points are calculated and awarded after the reveal time for each question</li>
              <li>We reserve the right to adjust point calculations to maintain fairness</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Prohibited Conduct</h2>
            <p className="text-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
              <li>Create multiple accounts to manipulate rankings or points</li>
              <li>Use bots, scripts, or automated tools to interact with the platform</li>
              <li>Attempt to manipulate, exploit, or abuse the voting or points system</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Share or sell your account credentials</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Content and Intellectual Property</h2>
            <p className="text-foreground mb-4">
              All content on Pally Predict, including text, graphics, logos, icons, images, and software, is owned by or licensed to us and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. No Monetary Value</h2>
            <p className="text-foreground mb-4">
              Alpha points have no monetary value and cannot be exchanged for cash or any form of compensation. They are solely for entertainment and competitive purposes within the Pally Predict platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Termination</h2>
            <p className="text-foreground mb-4">
              We reserve the right to suspend or terminate your account at our discretion, without notice, for conduct that we believe violates these Terms of Service, is harmful to other users, or is otherwise objectionable. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Disclaimers</h2>
            <p className="text-foreground mb-4">
              PALLY PREDICT IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Limitation of Liability</h2>
            <p className="text-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PALLY PREDICT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Changes to Terms</h2>
            <p className="text-foreground mb-4">
              We reserve the right to modify these Terms of Service at any time. We will notify users of material changes by updating the "Last Updated" date. Your continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Governing Law</h2>
            <p className="text-foreground mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which Pally Predict operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Contact Information</h2>
            <p className="text-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us through our support channels.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
