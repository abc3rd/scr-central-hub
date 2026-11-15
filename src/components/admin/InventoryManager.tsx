import { Minus, Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { availableStock, fmtMoney, useApp } from '@/lib/store';

export function InventoryManager() {
  const {
    skus,
    locations,
    setStock,
    adjustStock,
    logAudit,
    pushToast,
  } = useApp();
  const [tab, setTab] = useState(locations[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const commit = (skuId: string) => {
    const raw = drafts[skuId];
    if (raw === undefined) return;
    const value = parseInt(raw, 10);
    if (Number.isNaN(value) || value < 0) {
      pushToast({
        tone: 'warn',
        title: 'Invalid stock value',
        description: 'Enter a whole number of units (0 or more).',
      });
      return;
    }
    setStock(skuId, tab, value);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[skuId];
      return next;
    });
    const sku = skus.find((s) => s.id === skuId);
    logAudit('Al Curry (Admin)', 'Stock edited', `${sku?.code ?? skuId} @ ${tab} set to ${value}`);
    pushToast({
      tone: 'success',
      title: 'Stock updated',
      description: `${sku?.name ?? skuId} → ${value} units at ${tab === 'fm' ? 'Fort Myers' : 'LaBelle'}.`,
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
              <Package className="h-4 w-4 text-emerald-400" aria-hidden /> Live Stock
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              On hand minus reserved equals what's actually sellable. Low-stock rows are flagged automatically.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-zinc-800 p-1" role="tablist" aria-label="Location filter">
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                role="tab"
                aria-selected={tab === loc.id}
                onClick={() => setTab(loc.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                  tab === loc.id ? 'bg-emerald-600 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {loc.short}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="pb-2 pr-4 font-medium">SKU</th>
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 pr-4 font-medium">Margin</th>
                <th className="pb-2 pr-4 text-right font-medium">Reserved</th>
                <th className="pb-2 pr-4 text-right font-medium">Available</th>
                <th className="pb-2 font-medium">On hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {skus.map((sku) => {
                const onHand = sku.stock[tab] ?? 0;
                const reserved = sku.reserved?.[tab] ?? 0;
                const available = availableStock(sku, tab);
                const low = available <= sku.reorderPoint;
                const margin = ((sku.price - sku.cost) / sku.price) * 100;
                return (
                  <tr key={sku.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500">{sku.code}</td>
                    <td className="py-2.5 pr-4">
                      <p className="text-zinc-200">{sku.name}</p>
                      <p className="text-xs text-zinc-500">
                        {sku.category} · per {sku.unit}
                      </p>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300">{fmtMoney(sku.price)}</td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400"
                      >
                        {margin.toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-zinc-400">{reserved}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className={available <= sku.reorderPoint ? 'text-amber-400' : 'text-emerald-400'}>
                        {available}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Decrease ${sku.name} stock`}
                          className="h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          onClick={() => {
                            adjustStock(sku.id, tab, -1);
                            logAudit('Al Curry (Admin)', 'Stock adjusted', `${sku.code}: -1`);
                          }}
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Input
                          aria-label={`${sku.name} stock at selected location`}
                          className="h-8 w-20 border-zinc-700 bg-zinc-950 text-center text-sm text-zinc-100"
                          value={drafts[sku.id] ?? String(onHand)}
                          inputMode="numeric"
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [sku.id]: e.target.value }))
                          }
                          onBlur={() => commit(sku.id)}
                          onKeyDown={(e) => e.key === 'Enter' && commit(sku.id)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Increase ${sku.name} stock`}
                          className="h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          onClick={() => {
                            adjustStock(sku.id, tab, 1);
                            logAudit('Al Curry (Admin)', 'Stock adjusted', `${sku.code}: +1`);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        {low && (
                          <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/15">
                            Low ≤ {sku.reorderPoint}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
