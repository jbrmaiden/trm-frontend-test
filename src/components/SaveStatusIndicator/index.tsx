import { Cloud } from 'lucide-react';
import { useSanctionedStore } from '@/stores/sanctionedStore';

/**
 * Formats a timestamp into a human-readable relative time string.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string like "just now", "2 minutes ago", "1 hour ago"
 */
function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Displays a subtle indicator showing when addresses were last saved to localStorage.
 * Only renders if there has been at least one save (lastSaved is not null).
 */
export default function SaveStatusIndicator() {
  const lastSaved = useSanctionedStore((s) => s.lastSaved);

  if (!lastSaved) return null;

  const relativeTime = formatRelativeTime(lastSaved);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Cloud className="h-4 w-4" />
      <span>Saved {relativeTime}</span>
    </div>
  );
}
