import ResultsReveal from '../ResultsReveal';

export default function ResultsRevealExample() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <ResultsReveal
        question="Will $SOL outperform $ETH by 12 PM tomorrow?"
        userChoice="Long SOL"
        correctOutcome="A"
        userSide="A"
        aPct={37}
        bPct={63}
        aLabel="Long SOL"
        bLabel="Long ETH"
        pointsEarned={120}
        multiplier={1.43}
      />
      
      <ResultsReveal
        question="Will BTC reach $100k this week?"
        userChoice="Yes"
        correctOutcome="B"
        userSide="A"
        aPct={55}
        bPct={45}
        aLabel="Yes"
        bLabel="No"
      />
    </div>
  );
}
