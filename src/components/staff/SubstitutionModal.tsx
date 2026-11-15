import { Replace } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { availableStock, fmtMoney, getSku, useApp } from '@/lib/store';
import type { Order } from '@/lib/types';

/**
 * Staff propose a substitution — they no longer apply it unilaterally.
 * The order goes to "Awaiting Approval" and the customer approves or
 * declines from their portal (consent is explicit, not assumed).
 */
export function SubstitutionModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const { skus, updateOrder, logAudit, pushToast } = useApp();
  const [lineIdx, setLineIdx] = useState(0);
  const [replacementId, setReplacementId] = useState<string | null>(null);

  const line = order.lines[lineIdx];
  const original = getSku(skus, line.skuId);

  // Allowed swaps: same category first, only items with available stock at
  // this location, sorted so in-stock options lead the list.
  const alternatives = useMemo(() => {
    const sameCategory = skus.filter(
      (s) => s.id !== original.id && s.category === original.category,
    );
    const pool = sameCategory.length > 0 ? sameCategory : skus.filter((s) => s.id !== original.id);
    return [...pool].sort(
      (a, b) => availableStock(b, order.locationId) - availableStock(a, order.locationId),
    );
  }, [skus, original.id, order.locationId]);

  const propose = () => {
    if (!replacementId) return;
    const replacement = getSku(skus, replacementId);
    updateOrder(order.id, {
      status: 'Awaiting Approval',
      substitution: { lineIdx, proposedSkuId: replacementId, status: 'proposed' },
    });
    logAudit(
      'Ranch Hand',
      'Substitution proposed',
      `${order.id}: ${original.name} -> ${replacement.name} — sent to customer for approval`,
    );
    pushToast({
      tone: 'success',
      title: 'Approval requested',
      description: `${order.customerName} was texted the proposed swap (${original.name} → ${replacement.name}).`,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Replace className="h-4 w-4 text-sky-400" aria-hidden /> Propose substitution — {order.id}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Suggest a swap for an unfillable line. The customer approves or declines by SMS —
            nothing changes until they say yes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Order line
            </p>
            <div className="flex flex-wrap gap-2">
              {order.lines.map((l, i) => {
                const sku = getSku(skus, l.skuId);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setLineIdx(i);
                      setReplacementId(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                      i === lineIdx
                        ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/50'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {l.qty} × {sku.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Suggest a replacement for “{original.name}”
            </p>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {alternatives.length === 0 && (
                <li className="rounded-md bg-zinc-800/60 px-3 py-3 text-sm text-zinc-500">
                  No alternative items available for this line.
                </li>
              )}
              {alternatives.map((alt) => {
                const available = availableStock(alt, order.locationId);
                const disabled = available < line.qty;
                return (
                  <li key={alt.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setReplacementId(alt.id)}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        disabled
                          ? 'cursor-not-allowed bg-zinc-800/40 opacity-50'
                          : replacementId === alt.id
                            ? 'bg-emerald-500/15 ring-1 ring-emerald-500/50'
                            : 'bg-zinc-800/60 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-zinc-200">{alt.name}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                          {available} available
                        </Badge>
                        <span className="text-zinc-400">{fmtMoney(alt.price)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={propose}
              disabled={!replacementId}
              className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
            >
              Request customer approval
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
