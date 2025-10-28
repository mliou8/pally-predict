import { motion } from 'framer-motion';
import { Trophy, Share2, TrendingUp } from 'lucide-react';
import PointsBurst from './PointsBurst';
import { Button } from '@/components/ui/button';
import type { VoteChoice } from '@shared/schema';

interface OptionResult {
  choice: VoteChoice;
  label: string;
  percentage: number;
  votes: number;
  rank: number;
}

interface ResultsRevealProps {
  question: string;
  userChoice: VoteChoice;
  userChoiceLabel: string;
  results: OptionResult[];
  pointsEarned?: number;
  multiplier?: number;
}

export default function ResultsReveal({
  question,
  userChoice,
  userChoiceLabel,
  results,
  pointsEarned,
  multiplier
}: ResultsRevealProps) {
  const sortedResults = [...results].sort((a, b) => b.percentage - a.percentage);
  const userResult = results.find(r => r.choice === userChoice);
  const userRank = userResult?.rank || 0;

  const rankColors = {
    1: 'from-yellow-400 to-yellow-600',
    2: 'from-gray-300 to-gray-500',
    3: 'from-orange-400 to-orange-600',
    4: 'from-slate-400 to-slate-600',
  };

  const getRankEmoji = (rank: number) => {
    const emojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4️⃣' };
    return emojis[rank] || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-6 md:p-8 border border-card-border shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
    >
      <motion.h2
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="text-xl font-semibold mb-6 text-center bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent"
      >
        🎉 Results Revealed!
      </motion.h2>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3 text-center">{question}</p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-muted-foreground">You voted:</span>
          <span className="font-semibold text-foreground px-3 py-1 rounded-lg bg-muted">
            {userChoiceLabel}
          </span>
          <span className="text-2xl">{getRankEmoji(userRank)}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {sortedResults.map((result, index) => {
          const isUserChoice = result.choice === userChoice;
          const barColor = rankColors[result.rank as keyof typeof rankColors] || 'from-slate-400 to-slate-600';
          
          return (
            <motion.div
              key={result.choice}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-xl overflow-hidden ${isUserChoice ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="relative p-4 bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`absolute inset-0 bg-gradient-to-r ${barColor} opacity-20`}
                />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getRankEmoji(result.rank)}</span>
                    <div>
                      <div className="font-semibold text-foreground">{result.label}</div>
                      <div className="text-xs text-muted-foreground">{result.votes} votes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
                      {result.percentage}%
                    </div>
                    {isUserChoice && (
                      <div className="text-xs text-primary font-semibold">Your pick</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {userRank === 4 && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-muted border border-border">
          <TrendingUp className="text-brand-magenta" size={24} />
          <div>
            <div className="font-semibold text-foreground">Rare Pick Bonus! 🎯</div>
            <div className="text-sm text-muted-foreground">
              You predicted the unpopular choice - massive multiplier!
            </div>
          </div>
        </div>
      )}

      {userRank === 1 && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30">
          <Trophy className="text-yellow-500" size={24} />
          <div>
            <div className="font-semibold text-foreground">Top Answer! 🏆</div>
            <div className="text-sm text-muted-foreground">
              You picked what the crowd chose
            </div>
          </div>
        </div>
      )}

      {pointsEarned && multiplier && (
        <div className="mb-6 flex justify-center">
          <PointsBurst amount={pointsEarned} multiplier={multiplier} />
        </div>
      )}

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => console.log('Share clicked')}
        data-testid="button-share"
      >
        <Share2 size={16} className="mr-2" />
        Share your results
      </Button>
    </motion.div>
  );
}
