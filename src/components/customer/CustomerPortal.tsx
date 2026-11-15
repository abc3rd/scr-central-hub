import {
  Bell,
  CalendarClock,
  Check,
  CreditCard,
  Info,
  Loader2,
  MapPin,
  PiggyBank,
  RotateCcw,
  Star,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nextDeliveryDay, STARS_PRICE } from '@/lib/data';
import { authorizeCardHold, createShopifyOrder, sendSmsReceipt } from '@/lib/services';
import { availableStock, fmtMoney, getLocation, getSku, nextOrderId, useApp } from '@/lib/store';
import type { Member } from '@/lib/types';

export function CustomerPortal() {
  const {
    members,
    skus,
    orders,
    addOrder,
    reserveStock,
    joinStars,
    updateOrder,
    logAudit,
    pushToast,
    activeLocationId,
    announcements,
  } = useApp();
  const [memberId, setMemberId] = useState(members[0].id);
  const member = members.find((m) => m.id === memberId) ?? members[0];
  const isStars = member.plan === 'stars';
  const [reordering, setReordering] = useState<string | null>(null);

  const delivery = useMemo(() => nextDeliveryDay(), []);

  // Orders of this member that need their attention (substitution approvals).
  const approvals = orders.filter(
    (o) => o.memberId === member.id && o.status === 'Awaiting Approval' && o.substitution?.status === 'proposed',
  );

  const reorder = async (skuId: string) => {
    if (reordering || !isStars) return;
    const sku = getSku(skus, skuId);
    const onHand = sku.stock[member.locationId] ?? 0;
    const available = availableStock(sku, member.locationId);
    if (onHand === 0) {
      pushToast({ tone: 'warn', title: 'Out of stock', description: `${sku.name} is out of stock at your store.` });
      return;
    }
    if (available < 1) {
      pushToast({
        tone: 'warn',
        title: 'Fully reserved',
        description: `${sku.name} is reserved by open orders — call the store and we'll split a pallet.`,
      });
      return;
    }
    setReordering(skuId);
    try {
      const orderId = nextOrderId(orders);
      await createShopifyOrder(orderId, sku.price);
      const hold = await authorizeCardHold(orderId, member.cardLast4 ?? '0000', sku.price);
      // Two-step: reserve stock now, capture only when the pick ticket is verified.
      reserveStock(skuId, member.locationId, 1);
      addOrder({
        id: orderId,
        customerName: member.name,
        memberId: member.id,
        locationId: member.locationId,
        lines: [{ skuId, qty: 1, picked: false }],
        total: sku.price,
        status: 'Picking',
        placedAt: new Date().toISOString(),
        cardHoldStatus: 'authorized',
        qboStatus: 'pending',
      });
      logAudit('SCR Stars Club', 'One-tap reorder', `${member.name} reordered ${sku.name} via in-barn QR`);
      const sms = await sendSmsReceipt(member.name, orderId, sku.price);
      pushToast({
        tone: 'success',
        title: 'Reorder placed — stock reserved',
        description: `${hold.message}. ${sms.message}`,
      });
    } finally {
      setReordering(null);
    }
  };

  const decideSubstitution = (orderId: string, approve: boolean) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.substitution) return;
    const { lineIdx, proposedSkuId } = order.substitution;
    const line = order.lines[lineIdx];
    const original = getSku(skus, line.skuId);
    const proposed = getSku(skus, proposedSkuId);

    if (approve) {
      // Move the reservation from the original SKU to the substitute.
      reserveStock(original.id, order.locationId, -line.qty);
      reserveStock(proposed.id, order.locationId, line.qty);
      const delta = (proposed.price - original.price) * line.qty;
      updateOrder(orderId, {
        lines: order.lines.map((l, i) =>
          i === lineIdx ? { ...l, substitutedWith: proposedSkuId } : l,
        ),
        total: Math.max(0, order.total + delta),
        status: 'Picking',
        substitution: { ...order.substitution!, status: 'approved' },
      });
      logAudit('SCR Stars Club', 'Substitution approved', `${orderId}: ${original.name} -> ${proposed.name}`);
      pushToast({
        tone: 'success',
        title: 'Substitution approved',
        description: `${proposed.name} replaces ${original.name}. New total ${fmtMoney(Math.max(0, order.total + delta))}.`,
      });
    } else {
      updateOrder(orderId, {
        status: 'Picking',
        substitution: { ...order.substitution, status: 'declined' },
      });
      logAudit('SCR Stars Club', 'Substitution declined', `${orderId}: kept ${original.name}`);
      pushToast({ tone: 'info', title: 'Substitution declined', description: `We'll fill ${original.name} as ordered.` });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">SCR Stars Club</h1>
        <p className="mt-1 text-sm text-zinc-500">
          In-barn QR re-order portal · {getLocation(activeLocationId).name} · next delivery{' '}
          <span className="text-sky-400">
            {delivery.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </p>
      </div>

      {/* Membership card */}
      <Card
        className={`overflow-hidden border-zinc-800 bg-zinc-900 ring-1 ${
          isStars ? 'ring-amber-500/50' : 'ring-zinc-700/50'
        }`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ring-1 ${
                  isStars ? 'bg-amber-500/15 ring-amber-500/40' : 'bg-zinc-500/15 ring-zinc-500/40'
                }`}
              >
                {isStars ? (
                  <Star className="h-7 w-7 text-amber-400" aria-hidden />
                ) : (
                  <Star className="h-7 w-7 text-zinc-500" aria-hidden />
                )}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-zinc-100">{member.name}</p>
                  <Badge
                    className={
                      isStars
                        ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/15'
                        : 'bg-zinc-500/15 text-zinc-300 hover:bg-zinc-500/15'
                    }
                  >
                    <Star className="mr-1 h-3 w-3" aria-hidden />
                    {isStars ? 'Stars Club' : 'Free account'}
                  </Badge>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3" aria-hidden /> Home store:{' '}
                  {getLocation(member.locationId).short}
                  {isStars && member.memberSince && (
                    <span className="ml-2">
                      · Member since {new Date(member.memberSince).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {isStars ? (
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Card on file</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-zinc-300 sm:justify-end">
                  <CreditCard className="h-4 w-4 text-emerald-400" aria-hidden /> Visa ····{' '}
                  {member.cardLast4}
                </p>
                <p className="mt-0.5 text-xs text-emerald-400">
                  Authorized at reorder, captured on pickup
                </p>
              </div>
            ) : (
              <Button
                onClick={() => {
                  joinStars(member.id);
                  pushToast({
                    tone: 'success',
                    title: 'Welcome to Stars Club',
                    description: `${member.name} is now a Stars Club member at $${STARS_PRICE}/mo.`,
                  });
                }}
                className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
              >
                <Star className="mr-2 h-4 w-4" aria-hidden /> Join Stars Club — ${STARS_PRICE}/mo
              </Button>
            )}
          </div>

          {isStars ? (
            <div className="mt-5 grid gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg bg-zinc-800/50 p-3">
                <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Rewards Fund</p>
                  <p className="text-lg font-semibold text-zinc-100">{fmtMoney(member.rewardsFund)}</p>
                  <p className="text-xs text-zinc-500">
                    Earns 5% of every order, credited when your pick ticket is completed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-zinc-800/50 p-3">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Next delivery</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {delivery.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Trucks run Tuesday &amp; Friday — order by 6 PM the day before.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
              Stars Club members reorder from the barn in one tap, get the Rewards Fund, and
              priority substitution approvals. Join to unlock reorder below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Substitution approvals */}
      {approvals.length > 0 && (
        <Card className="border-amber-500/30 bg-zinc-900 ring-1 ring-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
              <Bell className="h-4 w-4 text-amber-400" aria-hidden /> Needs your OK
            </CardTitle>
            <p className="text-sm text-zinc-500">
              The store proposed a swap — approve or decline and we'll fill your order.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals.map((order) => {
              const sub = order.substitution!;
              const line = order.lines[sub.lineIdx];
              const original = getSku(skus, line.skuId);
              const proposed = getSku(skus, sub.proposedSkuId);
              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-lg bg-zinc-800/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="text-zinc-200">
                      <span className="font-medium">{order.id}</span> · {line.qty} × {original.name}
                    </p>
                    <p className="mt-0.5 text-zinc-400">
                      is out of stock — swap to{' '}
                      <span className="text-sky-400">{proposed.name}</span> (
                      {fmtMoney(proposed.price)} vs {fmtMoney(original.price)})?
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      onClick={() => decideSubstitution(order.id, true)}
                      className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideSubstitution(order.id, false)}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Reorder grid */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Your usuals</h2>
          <p className="text-sm text-zinc-500">
            {isStars
              ? 'Tap to reserve a unit — a ranch hand picks it, your card is captured on pickup.'
              : 'Join Stars Club to reorder in one tap.'}
          </p>
        </div>
        <div className="w-56">
          <Label htmlFor="member-select" className="sr-only">
            Preview customer
          </Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger id="member-select" className="h-9 bg-zinc-900 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((m: Member) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.plan === 'stars' ? 'Stars' : 'Free'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {member.frequentSkuIds.map((skuId) => {
          const sku = getSku(skus, skuId);
          const onHand = sku.stock[member.locationId] ?? 0;
          const available = availableStock(sku, member.locationId);
          const low = onHand <= sku.reorderPoint;
          const disabled = reordering !== null || onHand === 0 || available < 1 || !isStars;
          return (
            <Card key={skuId} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-zinc-200">{sku.name}</CardTitle>
                <p className="text-sm text-zinc-500">
                  {sku.category} · per {sku.unit} ·{' '}
                  <span className={low ? 'text-amber-400' : 'text-emerald-400'}>
                    {available} available
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-zinc-100">{fmtMoney(sku.price)}</p>
                <Button
                  size="sm"
                  disabled={disabled}
                  title={!isStars ? 'Stars Club members only' : undefined}
                  onClick={() => void reorder(skuId)}
                  className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
                >
                  {reordering === skuId ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  )}
                  Reorder
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hay Announcements feed */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <Bell className="h-4 w-4 text-emerald-400" aria-hidden /> Hay Announcements
          </CardTitle>
          <p className="text-sm text-zinc-500">From the feed room — posted by the stores, texted via GHL.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {announcements.map((ann) => (
            <div key={ann.id} className="rounded-lg bg-zinc-800/50 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100">{ann.title}</p>
                <p className="shrink-0 text-xs text-zinc-500">
                  {ann.author} · {new Date(ann.at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{ann.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <Info className="h-4 w-4 text-sky-400" aria-hidden /> How the hold works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-4">
            <li className="rounded-lg bg-zinc-800/50 p-3">
              <span className="font-semibold text-zinc-200">1. Tap reorder</span> — a unit is
              reserved for you and a pick ticket opens at your store.
            </li>
            <li className="rounded-lg bg-zinc-800/50 p-3">
              <span className="font-semibold text-zinc-200">2. Ranch hand picks</span> — tick,
              tick, done. If something's short, you'll get a swap proposal to approve.
            </li>
            <li className="rounded-lg bg-zinc-800/50 p-3">
              <span className="font-semibold text-zinc-200">3. Card captured</span> — only when the
              ticket is verified at pickup. Holds are never charged before that.
            </li>
            <li className="rounded-lg bg-zinc-800/50 p-3">
              <span className="font-semibold text-zinc-200">4. SMS receipt</span> — GoHighLevel
              texts confirmation with your pickup window and Rewards Fund credit.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
