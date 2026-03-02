import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Colors, { OPTION_COLORS } from '@/constants/colors';

interface ActivityItem {
  id: string;
  handle: string;
  choice: 'A' | 'B' | 'C' | 'D';
  timeAgo: string;
}

interface ActivityFeedProps {
  questionId?: string;
}

export default function ActivityFeed({ questionId }: ActivityFeedProps) {
  const { data: activity = [] } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activity/recent', questionId],
    queryFn: async () => {
      const url = questionId
        ? `/api/activity/recent?questionId=${questionId}&limit=5`
        : '/api/activity/recent?limit=5';
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000,
  });

  if (activity.length === 0) {
    return null;
  }

  const getChoiceColor = (choice: 'A' | 'B' | 'C' | 'D') => {
    const index = choice.charCodeAt(0) - 65; // A=0, B=1, etc.
    return OPTION_COLORS[index % OPTION_COLORS.length];
  };

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ backgroundColor: Colors.dark.surface }}
    >
      <div
        className="text-xs font-medium mb-3 uppercase tracking-wider"
        style={{ color: Colors.dark.textMuted }}
      >
        Live Activity
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activity.slice(0, 5).map((item, index) => {
            const colors = getChoiceColor(item.choice);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 text-sm"
              >
                <span style={{ color: Colors.dark.textMuted }}>@{item.handle}</span>
                <span style={{ color: Colors.dark.textMuted }}>picked</span>
                <span
                  className="px-2 py-0.5 rounded font-bold text-xs"
                  style={{
                    backgroundColor: colors.bgDim,
                    color: colors.textAlt,
                  }}
                >
                  {item.choice}
                </span>
                <span
                  className="ml-auto text-xs"
                  style={{ color: Colors.dark.textMuted }}
                >
                  {item.timeAgo}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
