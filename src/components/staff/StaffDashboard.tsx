import { ListChecks, PlusCircle, QrCode, Rows3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CounterSalesFeed } from '@/components/staff/CounterSalesFeed';
import { HayRowAdjuster } from '@/components/staff/HayRowAdjuster';
import { PickTickets } from '@/components/staff/PickTickets';
import { QRapidScanner } from '@/components/warehouse/QRapidScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/lib/store';

const TABS = [
  { value: 'queue', label: 'Pick Tickets', icon: ListChecks },
  { value: 'pos', label: 'Counter Sales (POS)', icon: PlusCircle },
  { value: 'scanner', label: 'QRapid Scanner', icon: QrCode },
  { value: 'hay', label: 'Hay Rows', icon: Rows3 },
];

export function StaffDashboard() {
  const { pendingQrRowId } = useApp();
  const [tab, setTab] = useState('queue');

  // A deep-linked hay-row QR (#/q/<store>/<rowId>) jumps straight to the scanner
  // tab so the intake modal opens on top of it.
  useEffect(() => {
    if (pendingQrRowId) setTab('scanner');
  }, [pendingQrRowId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Ranch Hand Console</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fulfillment queue, counter sales, holds, substitutions &amp; warehouse intake
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 gap-1 bg-zinc-900 sm:grid-cols-4">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <Icon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="queue" className="mt-4">
          <PickTickets />
        </TabsContent>
        <TabsContent value="pos" className="mt-4">
          <CounterSalesFeed />
        </TabsContent>
        <TabsContent value="scanner" className="mt-4">
          <QRapidScanner />
        </TabsContent>
        <TabsContent value="hay" className="mt-4">
          <HayRowAdjuster />
        </TabsContent>
      </Tabs>
    </div>
  );
}
