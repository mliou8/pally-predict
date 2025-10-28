import VoteMeter from '../VoteMeter';

export default function VoteMeterExample() {
  return (
    <div className="p-8 space-y-6">
      <VoteMeter used={0} total={5} />
      <VoteMeter used={2} total={5} />
      <VoteMeter used={5} total={5} />
    </div>
  );
}
