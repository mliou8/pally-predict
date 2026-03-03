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
  // TODO: Implement real notifications from API
  const notifications: Array<{
    type: 'new_prompt' | 'results' | 'rank_change';
    title: string;
    body: string;
    timestamp: string;
  }> = [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Stay updated on new questions and results
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                Enable browser notifications to get updates
              </p>
            </div>
          ) : (
            notifications.map((notif, i) => (
              <NotificationItem key={i} {...notif} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
