import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Share2 } from 'lucide-react';
import ChartSplit from './ChartSplit';
import PointsBurst from './PointsBurst';
import { Button } from '@/components/ui/button';

interface ResultsRevealProps {
  question: string;
  userChoice: string;
  correctOutcome: 'A' | 'B';
  userSide: 'A' | 'B';
  aPct: number;
  bPct: number;
  aLabel: string;
  bLabel: string;
  pointsEarned?: number;
  multiplier?: number;
}

export default function ResultsReveal({
  question,
  userChoice,
  correctOutcome,
  userSide,
  aPct,
  bPct,
  aLabel,
  bLabel,
  pointsEarned,
  multiplier
}: ResultsRevealProps) {
  const isCorrect = userSide === correctOutcome;

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
        Results Revealed!
      </motion.h2>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2 text-center">{question}</p>
        <p className="text-center text-foreground mb-4">
          You chose: <span className="font-semibold">{userChoice}</span>
        </p>
      </div>

      <div className="mb-6">
        <ChartSplit aPct={aPct} bPct={bPct} aLabel={aLabel} bLabel={bLabel} />
      </div>

      <div className="flex items-center justify-center gap-3 mb-6 p-4 rounded-xl bg-muted">
        {isCorrect ? (
          <>
            <CheckCircle2 className="text-success" size={24} />
            <span className="font-semibold text-success">You were right!</span>
          </>
        ) : (
          <>
            <XCircle className="text-destructive" size={24} />
            <span className="font-semibold text-destructive">Close call</span>
          </>
        )}
      </div>

      {isCorrect && pointsEarned && multiplier && (
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
        Share your call
      </Button>
    </motion.div>
  );
}
