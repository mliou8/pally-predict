import { motion } from 'framer-motion';

interface ChartSplitProps {
  aPct: number;
  bPct: number;
  aLabel: string;
  bLabel: string;
}

export default function ChartSplit({ aPct, bPct, aLabel, bLabel }: ChartSplitProps) {
  return (
    <div className="space-y-3" data-testid="chart-split">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground w-24 truncate">{aLabel}</span>
        <div className="flex-1 h-10 bg-muted rounded-xl overflow-hidden flex items-center">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${aPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-end pr-3"
          >
            <span className="text-sm font-bold text-primary-foreground font-mono">
              {aPct}%
            </span>
          </motion.div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground w-24 truncate">{bLabel}</span>
        <div className="flex-1 h-10 bg-muted rounded-xl overflow-hidden flex items-center">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            className="h-full bg-gradient-to-r from-brand-magenta to-brand-magenta/80 flex items-center justify-end pr-3"
          >
            <span className="text-sm font-bold text-brand-magenta-foreground font-mono">
              {bPct}%
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
