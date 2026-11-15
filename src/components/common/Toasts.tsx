import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';

const TONE_STYLES: Record<
  string,
  { icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: 'ring-emerald-500/40', iconColor: 'text-emerald-400' },
  info: { icon: Info, ring: 'ring-sky-500/40', iconColor: 'text-sky-400' },
  warn: { icon: AlertTriangle, ring: 'ring-amber-500/40', iconColor: 'text-amber-400' },
};

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const tone = TONE_STYLES[toast.tone];
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg bg-zinc-900 p-3 shadow-xl ring-1 ${tone.ring}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.iconColor}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-zinc-400">{toast.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Dismiss notification"
              className="h-6 w-6 shrink-0 text-zinc-500 hover:text-zinc-200"
              onClick={() => dismissToast(toast.id)}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
