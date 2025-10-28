import AlphaPointsPill from '../AlphaPointsPill';

export default function AlphaPointsPillExample() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <AlphaPointsPill points={1020} />
      <AlphaPointsPill points={4230} />
      <AlphaPointsPill points={250} />
    </div>
  );
}
