import { CreditCard, ListPlus, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildSeedFeed } from '@/lib/data';
import { createShopifyOrder } from '@/lib/services';
import { fmtMoney, getSku, nextOrderId, useApp } from '@/lib/store';
import type { FeedItem } from '@/lib/types';

let feedSeq = 100;

export function CounterSalesFeed() {
  const { orders, addOrder, activeLocationId, adjustStock, skus, logAudit, pushToast, locations } =
    useApp();
  const storeQbo = locations.find((l) => l.id === activeLocationId)?.qboCompany ?? 'QBO';
  const [feed, setFeed] = useState<FeedItem[]>(buildSeedFeed);
  const [customerName, setCustomerName] = useState('');
  const [skuId, setSkuId] = useState(skus[0].id);
  const [qtyText, setQtyText] = useState('1');
  const [processing, setProcessing] = useState(false);

  const pushFeed = (text: string, tone: FeedItem['tone']) =>
    setFeed((prev) => [
      { id: `feed-${feedSeq++}`, at: new Date().toISOString(), text, tone },
      ...prev,
    ]);

  const submit = async () => {
    if (processing) return;
    const customer = customerName.trim() || 'Walk-in customer';
    const qty = Math.max(1, parseInt(qtyText, 10) || 1);
    const sku = getSku(skus, skuId);
    const total = sku.price * qty;
    const onHand = sku.stock[activeLocationId] ?? 0;

    if (onHand < qty) {
      pushToast({
        tone: 'warn',
        title: 'Insufficient stock',
        description: `${sku.name}: need ${qty}, only ${onHand} on hand at this location.`,
      });
      return;
    }

    setProcessing(true);
    try {
      const orderId = nextOrderId(orders);
      const shopify = await createShopifyOrder(orderId, total);
      pushFeed(`Shopify POS — ${shopify.message}`, 'sync');

      // Card-present sale: captured at the terminal, no member card hold involved.
      pushFeed(`QuickBooks Payments terminal — card present, ${fmtMoney(total)} captured`, 'terminal');
      adjustStock(sku.id, activeLocationId, -qty);

      addOrder({
        id: orderId,
        customerName: customer,
        locationId: activeLocationId,
        lines: [{ skuId: sku.id, qty, picked: true }],
        total,
        status: 'Fulfilled',
        placedAt: new Date().toISOString(),
        cardHoldStatus: 'captured',
        qboStatus: 'pending',
      });
      logAudit('Ranch Hand', 'Counter sale', `${orderId} · ${customer} · ${qty} × ${sku.name}`);
      pushFeed(`Synder — ${orderId} queued for the ${storeQbo} QuickBooks company file`, 'qbo');
      pushToast({
        tone: 'success',
        title: 'Counter sale complete',
        description: `${orderId} · ${fmtMoney(total)} · stock decremented.`,
      });
      setCustomerName('');
      setQtyText('1');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <ListPlus className="h-4 w-4 text-emerald-400" aria-hidden /> New counter sale
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Rings through Shopify POS, captures at the QuickBooks Payments terminal, and queues
            the invoice to this store's QuickBooks company file.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="counter-name" className="text-zinc-400">
              Customer
            </Label>
            <Input
              id="counter-name"
              placeholder="Walk-in customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="border-zinc-700 bg-zinc-950 text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="counter-sku" className="text-zinc-400">
                Item
              </Label>
              <Select value={skuId} onValueChange={setSkuId}>
                <SelectTrigger id="counter-sku" className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skus.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.name} — {fmtMoney(sku.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counter-qty" className="text-zinc-400">
                Qty
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Decrease quantity"
                  className="h-9 w-7 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setQtyText(String(Math.max(1, (parseInt(qtyText, 10) || 1) - 1)))}
                >
                  <Minus className="h-3 w-3" aria-hidden />
                </Button>
                <Input
                  id="counter-qty"
                  inputMode="numeric"
                  value={qtyText}
                  onChange={(e) => setQtyText(e.target.value)}
                  className="h-9 border-zinc-700 bg-zinc-950 px-1 text-center text-zinc-100"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Increase quantity"
                  className="h-9 w-7 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setQtyText(String((parseInt(qtyText, 10) || 1) + 1))}
                >
                  <Plus className="h-3 w-3" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          <p className="rounded-md bg-zinc-800/60 px-3 py-2 text-sm text-zinc-400">
            Total:{' '}
            <span className="font-semibold text-zinc-100">
              {fmtMoney((getSku(skus, skuId).price || 0) * Math.max(1, parseInt(qtyText, 10) || 1))}
            </span>
            <span className="ml-2 text-xs text-zinc-500">
              {getSku(skus, skuId).stock[activeLocationId] ?? 0} on hand here
            </span>
          </p>

          <Button
            onClick={submit}
            disabled={processing}
            className="w-full bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
          >
            <CreditCard className="mr-2 h-4 w-4" aria-hidden />
            {processing ? 'Processing…' : `Charge & queue to ${storeQbo}`}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <Plus className="h-4 w-4 text-sky-400" aria-hidden /> Live integration feed
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Shopify POS · QuickBooks Payments · Synder/QBO events → {storeQbo}
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {feed.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-md bg-zinc-800/50 px-3 py-2"
              >
                <Badge
                  className={
                    item.tone === 'terminal'
                      ? 'mt-0.5 bg-sky-500/15 text-sky-400 hover:bg-sky-500/15'
                      : item.tone === 'sync'
                        ? 'mt-0.5 bg-violet-500/15 text-violet-400 hover:bg-violet-500/15'
                        : 'mt-0.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15'
                  }
                >
                  {item.tone}
                </Badge>
                <div>
                  <p className="text-sm text-zinc-300">{item.text}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {new Date(item.at).toLocaleTimeString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
