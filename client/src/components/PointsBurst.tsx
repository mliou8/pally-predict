import { motion } from 'framer-motion';

interface PointsBurstProps {
  amount: number;
}

export default function PointsBurst({ amount }: PointsBurstProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="text-center"
      data-testid="points-burst"
    >
      <div
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border"
        style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.3)' }}
      >
        <span className="font-display text-3xl font-bold" style={{ color: '#FFD700' }}>
          +{amount}
        </span>
        <span className="text-lg font-bold" style={{ color: '#FFD700' }}>PP</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Pally Points earned
      </p>
    </motion.div>
  );
}
