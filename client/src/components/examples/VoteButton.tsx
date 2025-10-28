import VoteButton from '../VoteButton';

export default function VoteButtonExample() {
  const handleSelect = (value: 'A' | 'B') => {
    console.log('Selected:', value);
  };

  return (
    <div className="p-8 max-w-md flex flex-col gap-4">
      <VoteButton label="Yes / Long SOL" value="A" onSelect={handleSelect} />
      <VoteButton label="No / Long ETH" value="B" onSelect={handleSelect} />
      <VoteButton label="Disabled" value="A" disabled onSelect={handleSelect} />
    </div>
  );
}
