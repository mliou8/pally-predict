import NotificationItem from '../NotificationItem';

export default function NotificationItemExample() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-3">
      <NotificationItem
        type="new_prompt"
        title="New prompt is live 🧠"
        body="A new prediction is available. Cast your vote now!"
        timestamp="2 min ago"
      />
      <NotificationItem
        type="results"
        title="Results revealed — you gained 120 α points!"
        body="Your SOL prediction was correct. Rarity multiplier: ×1.43"
        timestamp="1 hour ago"
      />
      <NotificationItem
        type="rank_change"
        title="You're now Top 20 in AlphaRank 🏆"
        body="Congratulations! You've climbed to rank #18."
        timestamp="Yesterday"
      />
    </div>
  );
}
