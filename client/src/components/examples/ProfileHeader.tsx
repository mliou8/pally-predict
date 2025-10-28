import ProfileHeader from '../ProfileHeader';

export default function ProfileHeaderExample() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <ProfileHeader
        handle="@CryptoOracle"
        rank="Oracle"
        winRate={87}
        streak={12}
        totalPoints={4230}
      />
      <ProfileHeader
        handle="@NewTrader"
        rank="Bronze"
        winRate={55}
        streak={2}
        totalPoints={340}
      />
    </div>
  );
}
