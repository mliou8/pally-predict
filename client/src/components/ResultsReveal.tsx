import { motion } from 'framer-motion';
import { Trophy, Share2, TrendingUp, Coins } from 'lucide-react';
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
  questionDate?: string;
  isPublic?: boolean;
  userWager?: bigint;
  userPayout?: bigint;
  totalPot?: bigint;
}

export default function ResultsReveal({
  question,
  userChoice,
  userChoiceLabel,
  results,
  pointsEarned,
  multiplier,
  questionDate,
  isPublic,
  userWager,
  userPayout,
  totalPot
}: ResultsRevealProps) {
  const sortedResults = [...results].sort((a, b) => b.percentage - a.percentage);
  const userResult = results.find(r => r.choice === userChoice);
  const userRank = userResult?.rank || 0;
  const winningOption = sortedResults[0];
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const formatSol = (lamports?: bigint): string => {
    if (lamports === undefined) return '0.0000';
    const sol = Number(lamports) / 1e9;
    return sol.toFixed(4);
  };

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
      <div className="flex items-center justify-between mb-4">
        {questionDate && (
          <span className="text-xs text-muted-foreground" data-testid="text-result-date">
            {formatDate(questionDate)}
          </span>
        )}
        {isPublic !== undefined && (
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground" data-testid="text-vote-type">
            {isPublic ? 'Public' : 'Private'}
          </span>
        )}
      </div>

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
          <span className="text-muted-foreground">Your answer:</span>
          <span className="font-semibold text-foreground px-3 py-1 rounded-lg bg-muted" data-testid="text-user-choice">
            {userChoice} - {userChoiceLabel}
          </span>
          <span className="text-2xl">{getRankEmoji(userRank)}</span>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-brand-magenta/10 border border-primary/20">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Majority prediction</div>
          <div className="text-lg font-bold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent" data-testid="text-majority-prediction">
            {winningOption.choice} - {winningOption.label}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {winningOption.percentage}% of voters
          </div>
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

      {userWager !== undefined && userWager > BigInt(0) && (
        <div className="mb-6 space-y-3">
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-brand-magenta/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Betting Results</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your wager:</span>
                <span className="font-semibold text-foreground" data-testid="text-wager-amount">
                  {formatSol(userWager)} SOL
                </span>
              </div>
              {userPayout !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your payout:</span>
                  <span className={`font-bold ${userPayout > BigInt(0) ? 'text-green-500' : 'text-red-500'}`} data-testid="text-payout-amount">
                    {userPayout > BigInt(0) ? '+' : ''}{formatSol(userPayout)} SOL
                  </span>
                </div>
              )}
              {totalPot !== undefined && totalPot > BigInt(0) && (
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Total pot:</span>
                  <span className="font-semibold text-foreground" data-testid="text-total-pot">
                    {formatSol(totalPot)} SOL
                  </span>
                </div>
              )}
            </div>
          </div>
          {userPayout !== undefined && userPayout > BigInt(0) && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/30">
              <Trophy className="text-green-500" size={24} />
              <div>
                <div className="font-semibold text-foreground">Bet Won!</div>
                <div className="text-sm text-muted-foreground">
                  You won {formatSol(userPayout)} SOL from the pot
                </div>
              </div>
            </div>
          )}
          {userWager > BigInt(0) && (userPayout === undefined || userPayout === BigInt(0)) && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border">
              <div className="text-2xl">😔</div>
              <div>
                <div className="font-semibold text-foreground">Bet Lost</div>
                <div className="text-sm text-muted-foreground">
                  Better luck next time!
                </div>
              </div>
            </div>
          )}
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
