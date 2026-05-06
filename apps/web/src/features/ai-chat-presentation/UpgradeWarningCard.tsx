import { Lock } from 'lucide-react';

export function UpgradeWarningCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">AI usage limit reached.</p>
          <p className="text-xs opacity-85">{message}</p>
        </div>
      </div>
    </div>
  );
}

