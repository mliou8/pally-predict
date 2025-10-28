import { useState } from 'react';
import PromptCard from '@/components/PromptCard';
import VoteMeter from '@/components/VoteMeter';

export default function Home() {
  const [votesUsed, setVotesUsed] = useState(0); //todo: remove mock functionality

  //todo: remove mock functionality
  const closeTime = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
  
  const handleVote = (side: 'A' | 'B', isPublic: boolean) => {
    setVotesUsed(prev => Math.min(prev + 1, 5));
    console.log('Voted:', side, 'Public:', isPublic);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex justify-center">
          <VoteMeter used={votesUsed} total={5} />
        </div>

        <PromptCard
          category="Prediction Arena"
          question="Will $SOL outperform $ETH by 12 PM tomorrow?"
          closeAt={closeTime}
          optionA="Yes / Long SOL"
          optionB="No / Long ETH"
          onVote={handleVote}
        />

        {votesUsed >= 5 && (
          <div className="mt-6 p-6 rounded-2xl bg-muted border border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You've used all your daily votes!
            </p>
            <p className="text-xs text-muted-foreground">
              Come back tomorrow for 5 new votes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
