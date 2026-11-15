import { AlertTriangle, ArrowUpRight, Banknote, Landmark, Megaphone, RefreshCw, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AuditTrail } from '@/components/admin/AuditTrail';
import { InventoryManager } from '@/components/admin/InventoryManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { postQboInvoice } from '@/lib/services';
import { fmtMoney, getSku, useApp } from '@/lib/store';
import type { Order, QboStatus } from '@/lib/types';

const QBO_TONE: Record<QboStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/15',
  synced: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15',
  failed: 'bg-red-500/15 text-red-400 hover:bg-red-500/15',
};

export function AdminDashboard() {
  const {
    orders,
    skus,
    locations,
    audit,
    logAudit,
    pushToast,
    updateOrder,
    roleLabel,
    postAnnouncement,
  } = useApp();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const openHolds = orders.filter(
    (o) => o.cardHoldStatus === 'pending' || o.cardHoldStatus === 'authorized',
  );
  // Ledger queue: captured money that hasn't hit QBO yet — status is left untouched.
  const qboQueue = orders.filter((o) => o.qboStatus !== 'synced' && o.cardHoldStatus === 'captured');
  const qboFailed = qboQueue.filter((o) => o.qboStatus === 'failed');

  // Revenue counts captured money only — pending/authorized holds are not revenue yet.
  const stats = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let held = 0;
    for (const order of orders) {
      if (order.cardHoldStatus === 'captured') {
        revenue += order.total;
        for (const line of order.lines) {
          const sku = getSku(skus, line.substitutedWith ?? line.skuId);
          cost += sku.cost * line.qty;
        }
      } else {
        held += order.total;
      }
    }
    return { revenue, profit: revenue - cost, margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0, held };
  }, [orders, skus]);

  const perLocation = useMemo(
    () =>
      locations.map((loc) => {
        const locOrders = orders.filter((o) => o.locationId === loc.id);
        const captured = locOrders.filter((o) => o.cardHoldStatus === 'captured');
        const revenue = captured.reduce((sum, o) => sum + o.total, 0);
        let cost = 0;
        for (const order of captured) {
          for (const line of order.lines) {
            cost += getSku(skus, line.substitutedWith ?? line.skuId).cost * line.qty;
          }
        }
        const onHandValue = skus.reduce((sum, s) => sum + (s.stock[loc.id] ?? 0) * s.cost, 0);
        const reservedValue = skus.reduce(
          (sum, s) => sum + (s.reserved?.[loc.id] ?? 0) * s.cost,
          0,
        );
        return {
          loc,
          revenue,
          profit: revenue - cost,
          orders: locOrders.length,
          onHandValue,
          reservedValue,
          failed: locOrders.filter((o) => o.qboStatus === 'failed').length,
        };
      }),
    [locations, orders, skus],
  );

  const maxRevenue = Math.max(...perLocation.map((p) => p.revenue), 1);

  const getLocationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;

  const syncOne = async (order: Order) => {
    setSyncing(order.id);
    try {
      const result = await postQboInvoice(order.id, order.total);
      updateOrder(order.id, { qboStatus: 'synced' });
      logAudit(
        'Synder sync',
        order.qboStatus === 'failed' ? 'QBO ledger retry' : 'QBO ledger entry',
        `${result.reference} posted · ${order.customerName} · ${fmtMoney(order.total)}`,
      );
      pushToast({
        tone: 'success',
        title: order.qboStatus === 'failed' ? 'Retry succeeded' : 'QBO sync complete',
        description: `${order.id} pushed to ${getLocationName(order.locationId)} QBO via Synder.`,
      });
    } finally {
      setSyncing(null);
    }
  };

  const syncAllPending = async () => {
    if (syncing || qboQueue.length === 0) return;
    for (const order of qboQueue) {
      await syncOne(order);
    }
  };

  const publishAnnouncement = () => {
    if (!annTitle.trim() || !annBody.trim()) {
      pushToast({ tone: 'warn', title: 'Missing fields', description: 'Give the announcement a title and a body.' });
      return;
    }
    postAnnouncement(roleLabel, annTitle.trim(), annBody.trim());
    logAudit('Store ops', 'Hay Announcement posted', `${roleLabel}: "${annTitle.trim()}"`);
    pushToast({
      tone: 'success',
      title: 'Announcement posted',
      description: 'Pushed to the customer portal and queued as a GHL SMS broadcast.',
    });
    setAnnTitle('');
    setAnnBody('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Master Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Multi-location command view · per-store QuickBooks ledger · profit margins
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-zinc-500">Gross revenue (captured)</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-400" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{fmtMoney(stats.revenue)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="h-3 w-3" aria-hidden /> {orders.length} orders on record
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-zinc-500">Net profit</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{fmtMoney(stats.profit)}</p>
            <p className="mt-1 text-xs text-zinc-500">{stats.margin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-zinc-500">Open card holds</CardTitle>
            <Landmark className="h-4 w-4 text-sky-400" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{openHolds.length}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {fmtMoney(stats.held)} authorized, not yet captured
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-zinc-500">QBO exceptions</CardTitle>
            <Truck className="h-4 w-4 text-sky-400" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{qboFailed.length}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {qboQueue.length} invoice(s) waiting on the ledger
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Fort Myers vs. LaBelle</CardTitle>
            <p className="text-sm text-zinc-500">
              Captured revenue, profit and on-hand inventory value per store
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {perLocation.map(
              ({ loc, revenue, profit, orders: count, onHandValue, reservedValue, failed }) => (
                <div key={loc.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      {loc.name}
                      <span className="text-xs font-normal text-zinc-500">
                        → QBO: {loc.qboCompany}
                      </span>
                      {failed > 0 && (
                        <Badge className="bg-red-500/15 text-red-400 hover:bg-red-500/15">
                          <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                          {failed} failed
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {count} orders · profit {fmtMoney(profit)}
                    </p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(4, (revenue / maxRevenue) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    Revenue {fmtMoney(revenue)} · on hand {fmtMoney(onHandValue)} · reserved{' '}
                    {fmtMoney(reservedValue)}
                  </p>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
              <Megaphone className="h-4 w-4 text-emerald-400" aria-hidden /> Hay Announcements
            </CardTitle>
            <p className="text-sm text-zinc-500">
              Post to the customer portal; GHL broadcasts by SMS.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title" className="text-xs text-zinc-500">
                Title
              </Label>
              <Input
                id="ann-title"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Coastal square bale back in stock"
                className="border-zinc-800 bg-zinc-800 text-sm text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body" className="text-xs text-zinc-500">
                Message
              </Label>
              <Textarea
                id="ann-body"
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Fresh load landed Tuesday — reserve through the barn QR before Friday's truck."
                className="min-h-20 border-zinc-800 bg-zinc-800 text-sm text-zinc-100"
              />
            </div>
            <Button
              onClick={publishAnnouncement}
              disabled={!annTitle.trim() || !annBody.trim()}
              className="w-full bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
            >
              <Megaphone className="mr-2 h-4 w-4" aria-hidden /> Post announcement
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Per-location QuickBooks ledger */}
      <div className="grid gap-4 lg:grid-cols-2">
        {locations.map((loc) => {
          const locQueue = qboQueue.filter((o) => o.locationId === loc.id);
          return (
            <Card key={loc.id} className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
                  <Landmark className="h-4 w-4 text-emerald-400" aria-hidden /> {loc.name} →{' '}
                  {loc.qboCompany}
                </CardTitle>
                <p className="text-sm text-zinc-500">
                  Captured orders queued for this store's QuickBooks company file
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {locQueue.length === 0 && (
                  <p className="rounded-md bg-zinc-800/60 px-3 py-4 text-center text-sm text-zinc-500">
                    Ledger is clean — nothing waiting on QBO for this store.
                  </p>
                )}
                {locQueue.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-zinc-800/60 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-zinc-300">{order.id}</span>
                    <Badge className={QBO_TONE[order.qboStatus ?? 'pending']}>
                      {order.qboStatus === 'failed' ? (
                        <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                      ) : null}
                      {order.qboStatus ?? 'pending'}
                    </Badge>
                    <span className="text-zinc-200">{fmtMoney(order.total)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncing !== null}
                      onClick={() => void syncOne(order)}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <RefreshCw
                        className={`mr-1.5 h-3.5 w-3.5 ${syncing === order.id ? 'animate-spin' : ''}`}
                        aria-hidden
                      />
                      {order.qboStatus === 'failed' ? 'Retry' : 'Sync'}
                    </Button>
                  </div>
                ))}
                {locQueue.length > 1 && (
                  <Button
                    onClick={syncAllPending}
                    disabled={syncing !== null}
                    className="w-full bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${syncing !== null ? 'animate-spin' : ''}`}
                      aria-hidden
                    />
                    Sync all for {loc.short}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
          <TabsTrigger value="inventory">Multi-Location Inventory</TabsTrigger>
          <TabsTrigger value="audit">Staff Audit Trail</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory" className="mt-4">
          <InventoryManager />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTrail entries={audit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
