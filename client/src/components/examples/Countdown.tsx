import Countdown from '../Countdown';

export default function CountdownExample() {
  const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const urgentDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Normal (2h remaining)</p>
        <Countdown to={futureDate} size="md" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Urgent (30m remaining)</p>
        <Countdown to={urgentDate} size="md" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Small size</p>
        <Countdown to={futureDate} size="sm" />
      </div>
    </div>
  );
}
