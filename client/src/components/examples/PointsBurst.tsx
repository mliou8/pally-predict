import PointsBurst from '../PointsBurst';

export default function PointsBurstExample() {
  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-screen">
      <PointsBurst amount={120} multiplier={1.43} />
      <PointsBurst amount={250} multiplier={2.0} />
      <PointsBurst amount={50} multiplier={1.15} />
    </div>
  );
}
