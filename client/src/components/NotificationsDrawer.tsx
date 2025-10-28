import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import NotificationItem from './NotificationItem';

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  //todo: remove mock functionality
  const mockNotifications = [
    {
      type: 'new_prompt' as const,
      title: 'New prompt is live 🧠',
      body: 'A new prediction is available. Cast your vote now!',
      timestamp: '2 min ago',
    },
    {
      type: 'results' as const,
      title: 'Results revealed — you gained 120 α points!',
      body: 'Your SOL prediction was correct. Rarity multiplier: ×1.43',
      timestamp: '1 hour ago',
    },
    {
      type: 'rank_change' as const,
      title: "You're now Top 50 in AlphaRank 🏆",
      body: "Congratulations! You've climbed to rank #42.",
      timestamp: 'Yesterday',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Stay updated on new prompts and results
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {mockNotifications.map((notif, i) => (
            <NotificationItem key={i} {...notif} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
