import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ChevronDown, HelpCircle } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is Pally Predict?',
    answer: 'Pally Predict is a daily consensus game with one simple rule: pick what most people will pick. Every day at noon ET, a new question drops with 4 options. The most popular answer wins, and everyone who picked it shares the prize pool. It\'s not about being "right" - it\'s about thinking like the crowd.',
  },
  {
    category: 'Getting Started',
    question: 'How do I sign up?',
    answer: 'Simply click "Get Started" and sign in with your Twitter/X account. We use Twitter for verification to ensure all players are real people and to prevent bots from gaming the system.',
  },
  {
    category: 'Getting Started',
    question: 'Is it free to play?',
    answer: 'Yes! You can play for free and earn Alpha Points. If you want to bet for real rewards, you can optionally wager SOL on your predictions.',
  },

  // Gameplay
  {
    category: 'Gameplay',
    question: 'How does the consensus game work?',
    answer: 'There is no "correct" answer decided by real-world events. The winning answer is simply whatever option gets the most votes. If 55% of players pick Option A, then A wins - regardless of what the question was about. Your goal is to predict what the majority will choose, not what\'s factually correct.',
  },
  {
    category: 'Gameplay',
    question: 'When are new questions posted?',
    answer: 'New questions are posted every day at 12:00 PM Eastern Time. Results from the previous day\'s question are also revealed at this time.',
  },
  {
    category: 'Gameplay',
    question: 'Can I change my answer after voting?',
    answer: 'No, once you lock in your prediction, it\'s final. This ensures fairness and prevents players from changing their votes based on emerging trends.',
  },
  {
    category: 'Gameplay',
    question: 'Why do the answer options appear in different orders?',
    answer: 'We randomize the order of options for each player to prevent coordination and collusion. This ensures everyone is making independent predictions rather than just picking "Option A" together.',
  },

  // Points & Rewards
  {
    category: 'Points & Rewards',
    question: 'What are Alpha Points?',
    answer: 'Alpha Points are the in-game currency that tracks your prediction skill. You earn points based on how well you predict the consensus. Points unlock future rewards and determine your leaderboard ranking.',
  },
  {
    category: 'Points & Rewards',
    question: 'How are points calculated?',
    answer: 'Points are based on your placement:\n• 1st place (majority pick): 100 points\n• 2nd place: 75 points\n• 3rd place: 50 points\n• 4th place: 25 points\n• Participation: 10 points\n\nYou also get a 2x multiplier if you make your vote public!',
  },
  {
    category: 'Points & Rewards',
    question: 'How do payouts work?',
    answer: 'If you bet SOL and pick the winning answer (majority choice), you receive a proportional share of the total pot based on your bet size. 2nd place gets 25% back, 3rd gets 15%, and 4th gets 10%. This ensures even near-misses get some reward.',
  },
  {
    category: 'Points & Rewards',
    question: 'What is the Public Vote bonus?',
    answer: 'When you make your vote public (visible to other players), you earn 2x the normal points. It\'s a risk-reward tradeoff: more visibility for more points.',
  },

  // Leaderboard
  {
    category: 'Leaderboard',
    question: 'How does the leaderboard work?',
    answer: 'There are two leaderboards: Points (ranked by Alpha Points) and Earnings (ranked by total SOL won). Both reset weekly for fresh competition, with seasonal rewards for top performers.',
  },
  {
    category: 'Leaderboard',
    question: 'When do seasons reset?',
    answer: 'Seasons run for 7 days, resetting every Monday at noon ET. At the end of each season, top performers receive bonus rewards.',
  },

  // Technical
  {
    category: 'Technical',
    question: 'Why do I need to sign in with Twitter?',
    answer: 'Twitter verification helps us ensure all players are real people. This prevents bots and multi-accounting, which would otherwise undermine the fairness of the consensus game.',
  },
  {
    category: 'Technical',
    question: 'How do I connect my wallet?',
    answer: 'After creating your profile, you can optionally link a Solana wallet to make bets. Go to your Profile and click "Link Wallet" to connect.',
  },
  {
    category: 'Technical',
    question: 'Is my data secure?',
    answer: 'Yes. We only store the minimum data needed to run the game. Your Twitter login is handled by Privy, a trusted authentication provider. Votes are recorded on-chain for transparency.',
  },
];

export default function FAQ() {
  const [contentVisible, setContentVisible] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleItem = (index: number) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenItems(newOpen);
  };

  // Group FAQs by category
  const categories = [...new Set(faqs.map(f => f.category))];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back button */}
        <Link href="/">
          <a className="inline-flex items-center gap-2 mb-8 text-sm" style={{ color: Colors.dark.textMuted }}>
            <ArrowLeft size={16} />
            Back to home
          </a>
        </Link>

        {/* Header */}
        <div
          className={cn(
            'mb-12 transition-all duration-500',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle size={32} style={{ color: Colors.dark.accent }} />
            <h1 className="text-3xl font-bold" style={{ color: Colors.dark.text }}>
              FAQ
            </h1>
          </div>
          <p className="text-lg" style={{ color: Colors.dark.textSecondary }}>
            Everything you need to know about Pally Predict.
          </p>
        </div>

        {/* FAQ Categories */}
        {categories.map((category, catIndex) => {
          const categoryFaqs = faqs.filter(f => f.category === category);
          const startIndex = faqs.findIndex(f => f.category === category);

          return (
            <div
              key={category}
              className={cn(
                'mb-8 transition-all duration-500',
                contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: `${(catIndex + 1) * 100}ms` }}
            >
              <h2
                className="text-lg font-semibold mb-4 px-1"
                style={{ color: Colors.dark.accent }}
              >
                {category}
              </h2>
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  backgroundColor: Colors.dark.card,
                  borderColor: Colors.dark.border,
                }}
              >
                {categoryFaqs.map((faq, index) => {
                  const globalIndex = startIndex + index;
                  const isOpen = openItems.has(globalIndex);

                  return (
                    <div
                      key={globalIndex}
                      className="border-b last:border-b-0"
                      style={{ borderColor: Colors.dark.border }}
                    >
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
                      >
                        <span className="font-medium pr-4" style={{ color: Colors.dark.text }}>
                          {faq.question}
                        </span>
                        <ChevronDown
                          size={20}
                          className={cn(
                            'flex-shrink-0 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                          style={{ color: Colors.dark.textMuted }}
                        />
                      </button>
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200',
                          isOpen ? 'max-h-96' : 'max-h-0'
                        )}
                      >
                        <div
                          className="px-5 pb-5 text-sm whitespace-pre-line"
                          style={{ color: Colors.dark.textSecondary }}
                        >
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Still have questions */}
        <div
          className={cn(
            'p-6 rounded-2xl border text-center transition-all duration-500',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{
            backgroundColor: Colors.dark.card,
            borderColor: Colors.dark.border,
            transitionDelay: '500ms',
          }}
        >
          <h3 className="font-semibold mb-2" style={{ color: Colors.dark.text }}>
            Still have questions?
          </h3>
          <p className="text-sm mb-4" style={{ color: Colors.dark.textMuted }}>
            Reach out to us on Twitter or Telegram and we'll help you out.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://twitter.com/PallyPredict"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
            >
              Twitter/X
            </a>
            <a
              href="https://t.me/PallyPredict_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
            >
              Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
