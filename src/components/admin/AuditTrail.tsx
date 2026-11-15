import { ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuditEntry } from '@/lib/types';

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
          <ScrollText className="h-4 w-4 text-emerald-400" aria-hidden /> Staff Audit Trail
        </CardTitle>
        <p className="text-sm text-zinc-500">
          Every stock move, substitution, fulfillment and integration event — newest first.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-md bg-zinc-800/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-300">
                  <span className="font-medium text-zinc-100">{entry.action}</span>
                  <span className="text-zinc-500"> — {entry.detail}</span>
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {entry.actor} · {new Date(entry.at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
