import PromptCard from '../PromptCard';

export default function PromptCardExample() {
  const closeTime = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PromptCard
        category="Prediction Arena"
        question="Will $SOL outperform $ETH by 12 PM tomorrow?"
        closeAt={closeTime}
        optionA="Yes / Long SOL"
        optionB="No / Long ETH"
        onVote={(side, isPublic) => console.log('Voted', side, isPublic)}
      />
    </div>
  );
}
