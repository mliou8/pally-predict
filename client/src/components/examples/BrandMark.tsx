import BrandMark from '../BrandMark';

export default function BrandMarkExample() {
  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-screen">
      <BrandMark size="sm" />
      <BrandMark size="md" />
      <BrandMark size="lg" />
    </div>
  );
}
