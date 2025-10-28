import ChartSplit from '../ChartSplit';

export default function ChartSplitExample() {
  return (
    <div className="p-8 max-w-2xl space-y-8">
      <ChartSplit aPct={63} bPct={37} aLabel="Long ETH" bLabel="Long SOL" />
      <ChartSplit aPct={45} bPct={55} aLabel="Yes" bLabel="No" />
    </div>
  );
}
