import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface PointsBurstProps {
  amount: number;
  multiplier: number;
}

export default function PointsBurst({ amount, multiplier }: PointsBurstProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="text-center"
      data-testid="points-burst"
    >
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-brand-magenta/20 border border-primary/50">
        <Zap className="text-gold" size={24} fill="currentColor" />
        <span className="font-display text-3xl font-bold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
          +{amount}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground font-mono">
        rarity ×{multiplier.toFixed(2)}
      </p>
    </motion.div>
  );
}
