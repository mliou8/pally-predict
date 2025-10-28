import { useState } from 'react';
import VoteTypeToggle from '../VoteTypeToggle';

export default function VoteTypeToggleExample() {
  const [value, setValue] = useState<'public' | 'private'>('public');

  return (
    <div className="p-8 max-w-md">
      <VoteTypeToggle value={value} onChange={setValue} />
      <p className="mt-4 text-sm text-muted-foreground">
        Selected: <span className="text-foreground font-semibold">{value}</span>
      </p>
    </div>
  );
}
