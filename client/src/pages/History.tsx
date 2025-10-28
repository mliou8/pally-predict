import HistoryCard from '@/components/HistoryCard';

export default function History() {
  //todo: remove mock functionality
  const mockHistory = [
    {
      question: 'Will $SOL outperform $ETH by 12 PM tomorrow?',
      userChoice: 'Long SOL',
      outcome: 'correct' as const,
      pointsEarned: 120,
      timestamp: new Date().toISOString(),
      crowdSplitA: 37,
      crowdSplitB: 63,
    },
    {
      question: 'Will BTC break $100k this week?',
      userChoice: 'Yes',
      outcome: 'incorrect' as const,
      pointsEarned: 0,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      crowdSplitA: 65,
      crowdSplitB: 35,
    },
    {
      question: 'Will ETH reach $5k before end of month?',
      userChoice: 'No',
      outcome: 'correct' as const,
      pointsEarned: 85,
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      crowdSplitA: 40,
      crowdSplitB: 60,
    },
    {
      question: 'Will DOGE pump 20% this week?',
      userChoice: 'Yes',
      outcome: 'incorrect' as const,
      pointsEarned: 0,
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      crowdSplitA: 55,
      crowdSplitB: 45,
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-display font-bold mb-6 bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
          History
        </h1>

        <div className="space-y-3">
          {mockHistory.map((entry, i) => (
            <HistoryCard key={i} {...entry} />
          ))}
        </div>

        {mockHistory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No history yet</p>
            <p className="text-sm text-muted-foreground">
              Start voting on prompts to build your track record
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
