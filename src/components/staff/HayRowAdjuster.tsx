import { Minus, Plus, Rows3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLocation, getSku, useApp } from '@/lib/store';

export function HayRowAdjuster() {
  const { hayRows, activeLocationId, adjustHayRow, skus, logAudit, pushToast } = useApp();
  const rows = hayRows.filter((r) => r.locationId === activeLocationId);

  const adjust = (rowId: string, delta: number) => {
    adjustHayRow(rowId, delta);
    const row = hayRows.find((r) => r.id === rowId);
    if (row) {
      logAudit(
        'Ranch Hand',
        'Hay row adjusted',
        `${row.label}: ${delta > 0 ? '+' : ''}${delta} bales`,
      );
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
          <Rows3 className="h-4 w-4 text-emerald-400" aria-hidden /> Hay Row Manager
        </CardTitle>
        <p className="text-sm text-zinc-500">
          Bale counts per storage row — mirrored into live stock. Use the QRapid scanner for
          bulk intake.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-md bg-zinc-800/60 px-3 py-6 text-center text-sm text-zinc-500">
            No hay rows at this location.
          </p>
        )}
        {rows.map((row) => {
          const sku = getSku(skus, row.skuId);
          const pct = Math.min(100, (row.bales / row.capacity) * 100);
          const full = row.bales >= row.capacity;
          return (
            <div key={row.id} className="rounded-lg bg-zinc-800/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{row.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {getLocation(row.locationId).name} · SKU {sku.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
                    {row.bales} / {row.capacity} bales
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Remove one bale from ${row.label}`}
                    className="h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => adjust(row.id, -1)}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Add one bale to ${row.label}`}
                    className="h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => adjust(row.id, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={full}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => {
                      adjust(row.id, 50);
                      pushToast({
                        tone: 'info',
                        title: 'Bulk +50 bales',
                        description: `${row.label} updated (capped at ${row.capacity}).`,
                      });
                    }}
                  >
                    +50
                  </Button>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${full ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
