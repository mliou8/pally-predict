import { useState } from 'react';
import PromptCard from '@/components/PromptCard';
import ResultsReveal from '@/components/ResultsReveal';
import VoteMeter from '@/components/VoteMeter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { VoteChoice, QuestionType } from '@shared/schema';

export default function Home() {
  const [votesUsed, setVotesUsed] = useState(0);
  
  const closeTime = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
  
  const handleVote = (choice: VoteChoice, isPublic: boolean) => {
    setVotesUsed(prev => Math.min(prev + 1, 5));
    console.log('Voted:', choice, 'Public:', isPublic);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex justify-center">
          <VoteMeter used={votesUsed} total={5} />
        </div>

        <Tabs defaultValue="active" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <PromptCard
              questionType="consensus"
              question="Which token will trend most on Twitter this week?"
              context="Predict what the crowd thinks will happen"
              closeAt={closeTime}
              optionA="BONK"
              optionB="DOGE"
              optionC="WIF"
              optionD="PEPE"
              onVote={handleVote}
            />

            <PromptCard
              questionType="prediction"
              question="Will BTC close above $100k this week?"
              closeAt={closeTime}
              optionA="Yes, definitely"
              optionB="No, below $100k"
              onVote={handleVote}
            />

            <PromptCard
              questionType="preference"
              question="Most iconic crypto founder?"
              context="Who does the crowd love most?"
              closeAt={closeTime}
              optionA="Vitalik"
              optionB="Satoshi"
              optionC="CZ"
              optionD="SBF"
              onVote={handleVote}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsReveal
              question="Which memecoin mooned hardest in January?"
              userChoice="D"
              userChoiceLabel="PEPE"
              results={[
                { choice: 'A', label: 'BONK', percentage: 45, votes: 234, rank: 1 },
                { choice: 'B', label: 'DOGE', percentage: 30, votes: 156, rank: 2 },
                { choice: 'C', label: 'WIF', percentage: 20, votes: 104, rank: 3 },
                { choice: 'D', label: 'PEPE', percentage: 5, votes: 26, rank: 4 },
              ]}
              pointsEarned={850}
              multiplier={10}
            />

            <ResultsReveal
              question="Which chain will process the most transactions?"
              userChoice="A"
              userChoiceLabel="Solana"
              results={[
                { choice: 'A', label: 'Solana', percentage: 55, votes: 412, rank: 1 },
                { choice: 'B', label: 'Ethereum', percentage: 45, votes: 338, rank: 2 },
              ]}
              pointsEarned={100}
              multiplier={1}
            />
          </TabsContent>
        </Tabs>

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
