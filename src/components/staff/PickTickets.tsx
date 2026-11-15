import { Check, Navigation, Replace } from 'lucide-react';
import { useState } from 'react';
import { SubstitutionModal } from '@/components/staff/SubstitutionModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { REWARDS_PCT, STATUS_BADGE } from '@/lib/data';
import { sendSmsReceipt } from '@/lib/services';
import { availableStock, fmtMoney, getLocation, getSku, useApp } from '@/lib/store';
import type { Order } from '@/lib/types';

export function PickTickets() {
  const {
    orders,
    activeLocationId,
    updateOrder,
    setLinePicked,
    adjustStock,
    reserveStock,
    skus,
    logAudit,
    pushToast,
    accrueReward,
  } = useApp();
  const [proposing, setProposing] = useState<Order | null>(null);

  const queue = orders
    .filter(
      (o) =>
        o.locationId === activeLocationId &&
        (o.status === 'Picking' || o.status === 'Awaiting Approval' || o.status === 'Out for Delivery'),
    )
    .sort((a, b) => {
      if (a.status === 'Out for Delivery' && b.status !== 'Out for Delivery') return -1;
      if (b.status === 'Out for Delivery' && a.status !== 'Out for Delivery') return 1;
      return a.placedAt.localeCompare(b.placedAt);
    });

  const markDone = async (order: Order) => {
    // Capture + decrement happens here, once the ticket is verified.
    updateOrder(order.id, { status: 'Fulfilled', cardHoldStatus: 'captured', qboStatus: 'pending' });
    for (const line of order.lines) {
      const skuId = line.substitutedWith ?? line.skuId;
      reserveStock(skuId, order.locationId, -line.qty);
      adjustStock(skuId, order.locationId, -line.qty);
    }
    logAudit('Ranch Hand', 'Pick ticket completed', `${order.id} verified · card captured · ${order.lines.length} line(s) decremented`);

    // Rewards Fund accrues on capture.
    if (order.memberId) {
      accrueReward(order.memberId, Math.round(order.total * REWARDS_PCT) / 100);
    }

    const sms = await sendSmsReceipt(order.customerName, order.id, order.total);
    pushToast({
      tone: 'success',
      title: `${order.id} fulfilled`,
      description: `${sms.message} Stock decremented and card captured.`,
    });
  };

  return (
    <div className="space-y-3">
      {queue.length === 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-10 text-center text-sm text-zinc-500">
            No open pick tickets for this location.
          </CardContent>
        </Card>
      )}

      {queue.map((order) => {
        const allPicked = order.lines.every((l) => l.picked);
        const awaiting = order.status === 'Awaiting Approval';
        return (
          <Card key={order.id} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base text-zinc-100">
                  {order.id}
                  <Badge className={STATUS_BADGE[order.status]}>{order.status}</Badge>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    {getLocation(order.locationId).short}
                  </Badge>
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-500">
                  {order.customerName} · {new Date(order.placedAt).toLocaleString()} · hold:{' '}
                  <span
                    className={
                      order.cardHoldStatus === 'captured' ? 'text-emerald-400' : 'text-sky-400'
                    }
                  >
                    {order.cardHoldStatus}
                  </span>
                  {order.substitution?.status === 'proposed' && (
                    <span className="ml-1 text-amber-400">
                      · substitution proposed, waiting on customer
                    </span>
                  )}
                </p>
              </div>
              <p className="text-lg font-semibold text-zinc-100">{fmtMoney(order.total)}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="divide-y divide-zinc-800/70 rounded-lg bg-zinc-800/40">
                {order.lines.map((line, idx) => {
                  const sku = getSku(skus, line.skuId);
                  const swapped = line.substitutedWith ? getSku(skus, line.substitutedWith) : null;
                  const effective = swapped ?? sku;
                  const available = availableStock(sku, order.locationId);
                  const short = !swapped && available < line.qty;
                  return (
                    <li key={idx} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <Checkbox
                        aria-label={`Pick line ${idx + 1}`}
                        checked={!!line.picked}
                        disabled={awaiting}
                        onCheckedChange={(v) => setLinePicked(order.id, idx, v === true)}
                        className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-zinc-950"
                      />
                      <span className="min-w-0 flex-1 text-zinc-300">
                        <span className={line.picked ? 'line-through opacity-60' : ''}>
                          {line.qty} × {sku.name}
                        </span>
                        {swapped && (
                          <span className="ml-2 text-xs text-sky-400">swapped → {swapped.name}</span>
                        )}
                        {short && (
                          <span className="ml-2 text-xs text-amber-400">
                            short — only {available} available (reserved elsewhere)
                          </span>
                        )}
                      </span>
                      <span className="text-zinc-500">{fmtMoney(effective.price * line.qty)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={awaiting}
                  onClick={() => setProposing(order)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Replace className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Propose substitution
                </Button>
                {order.status === 'Out for Delivery' ? (
                  <Button
                    size="sm"
                    onClick={() => void markDone(order)}
                    className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Confirm delivery
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!allPicked || awaiting}
                    title={
                      allPicked
                        ? 'Verifies the ticket: captures the card and decrements on-hand stock.'
                        : 'Tick off every line to verify this ticket.'
                    }
                    onClick={() => void markDone(order)}
                    className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Mark done
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {proposing && <SubstitutionModal order={proposing} onClose={() => setProposing(null)} />}
    </div>
  );
}
