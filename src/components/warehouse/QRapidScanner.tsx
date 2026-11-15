import { Keyboard, QrCode, ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getLocation, getSku, useApp } from '@/lib/store';

type ScanState = 'idle' | 'scanning' | 'camera';

export function QRapidScanner() {
  const { hayRows, skus, intakeHayRow, logAudit, pushToast, pendingQrRowId, clearQrIntake } =
    useApp();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [manual, setManual] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [qty, setQty] = useState('50');

  // Deep link: opening a #/q/<store>/<rowId> URL parks the row in the store —
  // pop the intake modal as soon as we're mounted.
  useEffect(() => {
    if (pendingQrRowId) {
      setSelected(pendingQrRowId);
      clearQrIntake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQrRowId]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const stopAll = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    stopCamera();
    if (scanState !== 'idle') setScanState('idle');
  };

  // Cleanup on unmount / tab switch away.
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      stopCamera();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // QR tags carry web links — ./#/q/<store-slug>/<rowId> — so the same code opens
  // the intake flow on a phone. Normalize any form of that URL down to the row.
  const resolvePayload = (raw: string) => {
    const payload = raw.trim();
    if (!payload) return;
    const hashIdx = payload.indexOf('#/q/');
    const normalized =
      hashIdx >= 0
        ? payload
            .slice(hashIdx + 4) // strip scheme/host/#/q/
            .replace(/^https?:\/\/[^/]+\/q\//, '')
        : payload.replace(/^\.\//, '');
    const [storeSlug, rowId] = normalized.split('/').filter(Boolean);
    const slugToLoc: Record<string, string> = {
      'fort-myers': 'fm',
      fm: 'fm',
      labelle: 'lb',
      lb: 'lb',
    };
    const row = hayRows.find((r) => {
      if (rowId && r.id.toLowerCase() === rowId.toLowerCase()) return true;
      const loc = slugToLoc[storeSlug?.toLowerCase() ?? ''];
      return !!loc && r.locationId === loc && r.id.toLowerCase() === rowId?.toLowerCase();
    });
    if (!row) {
      pushToast({
        tone: 'warn',
        title: 'Unrecognized QR code',
        description: `No hay row matches "${payload}". Try one of the demo links below.`,
      });
      return;
    }
    setSelected(row.id);
  };

  // Demo mode: simulated scan picks a random row after a short sweep.
  const simulateScan = () => {
    if (scanState !== 'idle' || hayRows.length === 0) return;
    setScanState('scanning');
    const pick = hayRows[Math.floor(Math.random() * hayRows.length)].qrPayload;
    timerRef.current = window.setTimeout(() => {
      setScanState('idle');
      resolvePayload(pick);
    }, 1800);
  };

  // Live mode: real camera + BarcodeDetector where the browser supports it.
  const startCamera = async () => {
    if (scanState !== 'idle') return;
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      pushToast({
        tone: 'info',
        title: 'Camera scanning not supported here',
        description: 'This browser lacks BarcodeDetector — use Simulate scan or manual entry.',
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanState('camera');
    } catch {
      pushToast({
        tone: 'warn',
        title: 'Camera unavailable',
        description: 'Permission denied or no camera — use Simulate scan or manual entry.',
      });
    }
  };

  useEffect(() => {
    if (scanState !== 'camera' || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});

    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    let cancelled = false;
    const tick = async () => {
      if (cancelled || video.readyState < 2) {
        if (!cancelled) rafRef.current = requestAnimationFrame(() => void tick());
        return;
      }
      try {
        const codes = await detector.detect(video);
        if (codes.length > 0 && codes[0].rawValue) {
          stopCamera();
          setScanState('idle');
          resolvePayload(codes[0].rawValue);
          return;
        }
      } catch {
        // frame not decodable — keep polling
      }
      if (!cancelled) rafRef.current = requestAnimationFrame(() => void tick());
    };
    rafRef.current = requestAnimationFrame(() => void tick());
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanState]);

  const row = hayRows.find((r) => r.id === selected) ?? null;

  const logIntake = () => {
    if (!row) return;
    const parsed = parseInt(qty, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      pushToast({
        tone: 'warn',
        title: 'Invalid quantity',
        description: 'Enter a positive number of bales.',
      });
      return;
    }
    const applied = intakeHayRow(row.id, parsed);
    const capped = applied < parsed;
    logAudit('QRapid scan', 'Bulk intake', `${row.qrPayload} · +${applied} bales logged`);
    pushToast({
      tone: capped ? 'warn' : 'success',
      title: `+${applied} bales logged`,
      description: capped
        ? `${row.label} is at capacity — ${parsed - applied} bale(s) overflowed. QBO purchase receipt queued via Synder.`
        : `${row.label} updated. QBO purchase receipt queued via Synder.`,
    });
    setSelected(null);
    setQty('50');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <QrCode className="h-4 w-4 text-emerald-400" aria-hidden /> QRapid™ Scanner
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Point at a hay row QR tag, simulate a scan, or type the payload manually.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            aria-hidden
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
          >
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(zinc-700_1px,transparent_1px),linear-gradient(90deg,zinc-700_1px,transparent_1px)] [background-size:28px_28px]" />
            <div
              className={`absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 transition-colors ${
                scanState !== 'idle' ? 'border-emerald-400' : 'border-zinc-600'
              }`}
            />
            {scanState === 'scanning' && (
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg">
                <div className="h-0.5 w-full animate-pulse bg-emerald-400 shadow-[0_0_16px_2px_rgba(75,206,42,0.8)]" />
              </div>
            )}
            {scanState === 'camera' ? (
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <QrCode className="h-8 w-8 text-zinc-600" aria-hidden />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void startCamera()}
              disabled={scanState !== 'idle'}
              className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
            >
              <ScanLine className="mr-2 h-4 w-4" aria-hidden />
              {scanState === 'camera' ? 'Scanning…' : 'Scan with camera'}
            </Button>
            <Button
              variant="outline"
              onClick={simulateScan}
              disabled={scanState !== 'idle'}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <QrCode className="mr-2 h-4 w-4" aria-hidden />
              {scanState === 'scanning' ? 'Scanning…' : 'Simulate scan'}
            </Button>
            {scanState === 'camera' && (
              <Button
                variant="outline"
                onClick={stopAll}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                Stop
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="manual-qr"
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              <Keyboard className="h-3.5 w-3.5" aria-hidden /> Enter QR payload
            </label>
            <div className="flex gap-2">
              <Input
                id="manual-qr"
                placeholder="./#/q/fort-myers/row-fm-3"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && resolvePayload(manual)}
                className="border-zinc-700 bg-zinc-950 font-mono text-sm text-zinc-100"
              />
              <Button
                variant="outline"
                onClick={() => resolvePayload(manual)}
                disabled={!manual.trim()}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                Resolve
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hayRows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setManual(r.qrPayload)}
                  className="rounded bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-400 transition hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  {r.qrPayload}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <ScanLine className="h-4 w-4 text-emerald-400" aria-hidden /> Scan log
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Recent hay-row QR resolutions at either location.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {hayRows.map((r) => {
              const sku = getSku(skus, r.skuId);
              const pct = Math.min(100, (r.bales / r.capacity) * 100);
              return (
                <li key={r.id} className="rounded-md bg-zinc-800/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-mono text-xs text-zinc-400">{r.qrPayload}</p>
                    <Badge variant="outline" className="shrink-0 border-zinc-700 text-zinc-400">
                      {getLocation(r.locationId).short}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">
                      {r.bales}/{r.capacity} {sku.unit}s
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={row !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-md">
          {row && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4 text-emerald-400" aria-hidden /> Log bulk intake
                </DialogTitle>
                <DialogDescription className="text-zinc-500">
                  Scanned {row.qrPayload}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg bg-zinc-800/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{row.label}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {getLocation(row.locationId).name} · SKU {getSku(skus, row.skuId).code}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
                      {row.bales} / {row.capacity} bales
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, (row.bales / row.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="intake-qty"
                    className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    Bales received
                  </label>
                  <Input
                    id="intake-qty"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="border-zinc-700 bg-zinc-950 text-center text-lg font-semibold text-zinc-100"
                  />
                  <div className="flex gap-2 pt-1">
                    {[25, 50, 100].map((n) => (
                      <Button
                        key={n}
                        variant="outline"
                        size="sm"
                        onClick={() => setQty(String(n))}
                        className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        +{n}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={logIntake}
                    className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500 focus-visible:outline-emerald-500"
                  >
                    Log intake
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
