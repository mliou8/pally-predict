import HistoryCard from '../HistoryCard';

export default function HistoryCardExample() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <HistoryCard
        question="Will $SOL outperform $ETH by 12 PM tomorrow?"
        userChoice="Long SOL"
        outcome="correct"
        pointsEarned={120}
        timestamp={new Date().toISOString()}
        crowdSplitA={37}
        crowdSplitB={63}
      />
      <HistoryCard
        question="Will BTC break $100k this week?"
        userChoice="Yes"
        outcome="incorrect"
        pointsEarned={0}
        timestamp={new Date(Date.now() - 86400000).toISOString()}
        crowdSplitA={65}
        crowdSplitB={35}
      />
    </div>
  );
}
