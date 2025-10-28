import LeaderboardRow from '../LeaderboardRow';

export default function LeaderboardRowExample() {
  return (
    <div className="p-8 max-w-2xl space-y-2">
      <LeaderboardRow 
        rank={1} 
        handle="@DegenOracle" 
        accuracyPct={87} 
        points={4230}
        badges={['🔥', '🧠']}
      />
      <LeaderboardRow 
        rank={2} 
        handle="@CryptoTuna" 
        accuracyPct={84} 
        points={3970}
        badges={['🧠']}
      />
      <LeaderboardRow 
        rank={42} 
        handle="@You" 
        accuracyPct={68} 
        points={1020}
        isCurrentUser
      />
    </div>
  );
}
