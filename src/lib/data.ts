import type {
  Announcement,
  AuditEntry,
  HayRow,
  Location,
  Member,
  Order,
  Sku,
} from './types';

export const LOCATIONS: Location[] = [
  {
    id: 'fm',
    name: 'Sweet Cypress Ranch - Fort Myers',
    short: 'Fort Myers',
    address: '12300 Cypress Preserve Pkwy, Fort Myers, FL 33913',
    qboCompany: 'QBO · Fort Myers store (#5123)',
  },
  {
    id: 'lb',
    name: 'Sweet Cypress Ranch - LaBelle',
    short: 'LaBelle',
    address: '4500 Cowboy Way, LaBelle, FL 33935',
    qboCompany: 'QBO · LaBelle store (#8841)',
  },
];

export const STARS_PRICE = 9.99;
export const REWARDS_PCT = 5;

/* ------------------------------------------------------------------ */
/* Catalog — 24 SKUs across six categories                             */
/* ------------------------------------------------------------------ */

export const SEED_SKUS: Sku[] = [
  // Hay (4)
  { id: 'sku-hay-coastal', code: 'HAY-COA-01', name: 'Coastal Hay Bale (Row 3)', category: 'Hay', unit: 'bale', price: 14.5, cost: 9.2, reorderPoint: 120, stock: { fm: 342, lb: 189 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-hay-alfalfa-pallet', code: 'HAY-ALF-PB', name: 'Alfalfa Hay — Pallet B (21 bales)', category: 'Hay', unit: 'pallet', price: 329, cost: 241, reorderPoint: 8, stock: { fm: 14, lb: 6 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-hay-bermuda', code: 'HAY-BER-01', name: 'Bermuda Hay Bale', category: 'Hay', unit: 'bale', price: 15.75, cost: 10.4, reorderPoint: 80, stock: { fm: 154, lb: 92 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-hay-timothy', code: 'HAY-TIM-01', name: 'Timothy Hay Bale (2nd cutting)', category: 'Hay', unit: 'bale', price: 18.25, cost: 12.1, reorderPoint: 60, stock: { fm: 88, lb: 41 }, reserved: { fm: 0, lb: 0 } },
  // Feed (6)
  { id: 'sku-feed-sweet-50', code: 'FEED-SWT50', name: 'Sweet Feed 50lb', category: 'Feed', unit: 'bag', price: 27.99, cost: 19.4, reorderPoint: 60, stock: { fm: 212, lb: 98 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-feed-chick-starter', code: 'FEED-CHK20', name: 'Chick Starter Crumbles 20lb', category: 'Feed', unit: 'bag', price: 21.5, cost: 14.3, reorderPoint: 30, stock: { fm: 88, lb: 42 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-feed-senior-50', code: 'FEED-SEN50', name: 'Equine Senior 50lb', category: 'Feed', unit: 'bag', price: 31.25, cost: 22.6, reorderPoint: 40, stock: { fm: 76, lb: 34 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-feed-oats-50', code: 'FEED-OAT50', name: 'Whole Oats 50lb', category: 'Feed', unit: 'bag', price: 24.75, cost: 16.9, reorderPoint: 45, stock: { fm: 120, lb: 57 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-feed-alf-pellets', code: 'FEED-ALF40', name: 'Alfalfa Pellets 40lb', category: 'Feed', unit: 'bag', price: 26.5, cost: 18.2, reorderPoint: 35, stock: { fm: 64, lb: 28 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-feed-goat-50', code: 'FEED-GOT50', name: 'Goat Feed 50lb', category: 'Feed', unit: 'bag', price: 28.4, cost: 19.8, reorderPoint: 25, stock: { fm: 47, lb: 22 }, reserved: { fm: 0, lb: 0 } },
  // Supplement (4)
  { id: 'sku-feed-senior-supp', code: 'SUPP-SEN01', name: 'Senior Horse Supplement 8lb', category: 'Supplement', unit: 'bag', price: 64.5, cost: 41.75, reorderPoint: 15, stock: { fm: 27, lb: 11 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-supp-joint', code: 'SUPP-JNT05', name: 'Joint Support Pellets 5lb', category: 'Supplement', unit: 'tub', price: 72.0, cost: 48.3, reorderPoint: 12, stock: { fm: 21, lb: 9 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-supp-electrolyte', code: 'SUPP-ELY05', name: 'Electrolyte Plus 5lb', category: 'Supplement', unit: 'tub', price: 38.9, cost: 25.1, reorderPoint: 14, stock: { fm: 33, lb: 14 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-supp-hoof', code: 'SUPP-HOF02', name: 'Hoof & Coat Conditioner 2lb', category: 'Supplement', unit: 'tub', price: 44.25, cost: 29.6, reorderPoint: 10, stock: { fm: 18, lb: 8 }, reserved: { fm: 0, lb: 0 } },
  // Care (4)
  { id: 'sku-care-fly-spray', code: 'CARE-UBFS', name: 'Ultra-Bite Fly Spray 32oz', category: 'Care', unit: 'jug', price: 18.25, cost: 10.1, reorderPoint: 24, stock: { fm: 46, lb: 19 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-care-fly-wipe', code: 'CARE-UBFW', name: 'Ultra-Bite Fly Wipe Refill 40ct', category: 'Care', unit: 'tub', price: 16.75, cost: 9.8, reorderPoint: 18, stock: { fm: 33, lb: 15 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-care-shampoo', code: 'CARE-SHM01', name: 'Coat Shampoo Gallon', category: 'Care', unit: 'jug', price: 34.5, cost: 21.7, reorderPoint: 10, stock: { fm: 15, lb: 7 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-care-wound', code: 'CARE-WND03', name: 'Wound Spray 3oz', category: 'Care', unit: 'bottle', price: 12.9, cost: 7.4, reorderPoint: 20, stock: { fm: 41, lb: 18 }, reserved: { fm: 0, lb: 0 } },
  // Bedding (3)
  { id: 'sku-bed-pine', code: 'BED-PIN20', name: 'Pine Shavings 20lb', category: 'Bedding', unit: 'bag', price: 9.85, cost: 6.1, reorderPoint: 50, stock: { fm: 142, lb: 66 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-bed-straw', code: 'BED-STR01', name: 'Straw Bale', category: 'Bedding', unit: 'bale', price: 8.5, cost: 5.2, reorderPoint: 70, stock: { fm: 201, lb: 88 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-bed-hemp', code: 'BED-HEM15', name: 'Hemp Bedding 15lb', category: 'Bedding', unit: 'bag', price: 22.75, cost: 14.9, reorderPoint: 16, stock: { fm: 24, lb: 10 }, reserved: { fm: 0, lb: 0 } },
  // Tack (3)
  { id: 'sku-tack-rope', code: 'TACK-ROP01', name: 'Cotton Lead Rope 8ft', category: 'Tack', unit: 'each', price: 13.95, cost: 7.8, reorderPoint: 20, stock: { fm: 37, lb: 16 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-tack-scoop', code: 'TACK-SCP03', name: 'Feed Scoop 3qt', category: 'Tack', unit: 'each', price: 7.25, cost: 3.9, reorderPoint: 24, stock: { fm: 52, lb: 24 }, reserved: { fm: 0, lb: 0 } },
  { id: 'sku-tack-halter', code: 'TACK-HALLG', name: 'Halter — Full Size', category: 'Tack', unit: 'each', price: 24.5, cost: 14.2, reorderPoint: 12, stock: { fm: 19, lb: 9 }, reserved: { fm: 0, lb: 0 } },
];

/* ------------------------------------------------------------------ */
/* Membership — Free plan or Stars Club ($9.99/mo). No tiers, no points */
/* ------------------------------------------------------------------ */

export const SEED_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    name: 'Dana Whitfield',
    plan: 'stars',
    memberSince: '2025-03-12',
    rewardsFund: 41.75,
    locationId: 'fm',
    frequentSkuIds: ['sku-hay-coastal', 'sku-feed-sweet-50', 'sku-care-fly-spray'],
    cardLast4: '4471',
  },
  {
    id: 'mem-2',
    name: 'Pine Hollow Stables',
    plan: 'stars',
    memberSince: '2024-11-02',
    rewardsFund: 128.2,
    locationId: 'fm',
    frequentSkuIds: ['sku-hay-alfalfa-pallet', 'sku-hay-coastal', 'sku-feed-chick-starter'],
    cardLast4: '8802',
  },
  {
    id: 'mem-3',
    name: 'Rebecca Okafor',
    plan: 'stars',
    memberSince: '2026-01-28',
    rewardsFund: 12.6,
    locationId: 'lb',
    frequentSkuIds: ['sku-hay-coastal', 'sku-feed-sweet-50'],
    cardLast4: '1936',
  },
  {
    id: 'mem-4',
    name: 'Mike Trujillo',
    plan: 'free',
    rewardsFund: 0,
    locationId: 'lb',
    frequentSkuIds: ['sku-feed-senior-supp', 'sku-care-fly-spray'],
  },
  {
    id: 'mem-5',
    name: 'Citrus Grove Equestrian',
    plan: 'free',
    rewardsFund: 0,
    locationId: 'fm',
    frequentSkuIds: ['sku-care-fly-spray', 'sku-bed-pine'],
  },
];

/* ------------------------------------------------------------------ */
/* Orders — new flow: reorder reserves stock and opens a pick ticket;  */
/* card is captured only when the ticket is verified.                  */
/* ------------------------------------------------------------------ */

export const SEED_ORDERS: Order[] = [
  {
    id: 'SCR-1042',
    customerName: 'Dana Whitfield',
    memberId: 'mem-1',
    locationId: 'fm',
    lines: [
      { skuId: 'sku-hay-coastal', qty: 20, picked: true },
      { skuId: 'sku-feed-sweet-50', qty: 2, picked: false },
    ],
    total: 345.98,
    status: 'Picking',
    placedAt: '2026-11-15T13:42:00Z',
    cardHoldStatus: 'authorized',
    qboStatus: 'pending',
  },
  {
    id: 'SCR-1043',
    customerName: 'Mike Trujillo',
    locationId: 'lb',
    lines: [
      { skuId: 'sku-feed-senior-supp', qty: 1, picked: false },
      { skuId: 'sku-care-fly-spray', qty: 1, picked: false },
    ],
    total: 82.75,
    status: 'Picking',
    placedAt: '2026-11-15T14:05:00Z',
    cardHoldStatus: 'authorized',
    qboStatus: 'pending',
  },
  {
    id: 'SCR-1044',
    customerName: 'Pine Hollow Stables',
    memberId: 'mem-2',
    locationId: 'fm',
    lines: [
      { skuId: 'sku-hay-alfalfa-pallet', qty: 2, picked: true },
      { skuId: 'sku-feed-chick-starter', qty: 4, picked: true },
    ],
    total: 744,
    status: 'Out for Delivery',
    placedAt: '2026-11-14T16:22:00Z',
    cardHoldStatus: 'captured',
    qboStatus: 'synced',
  },
  {
    id: 'SCR-1045',
    customerName: 'Rebecca Okafor',
    memberId: 'mem-3',
    locationId: 'lb',
    lines: [
      { skuId: 'sku-hay-coastal', qty: 10, picked: false },
      { skuId: 'sku-feed-sweet-50', qty: 1, picked: false },
    ],
    total: 172.99,
    status: 'Picking',
    placedAt: '2026-11-15T14:31:00Z',
    cardHoldStatus: 'authorized',
    qboStatus: 'pending',
  },
  {
    id: 'SCR-1038',
    customerName: 'Dana Whitfield',
    memberId: 'mem-1',
    locationId: 'fm',
    lines: [{ skuId: 'sku-feed-sweet-50', qty: 3, picked: true }],
    total: 83.97,
    status: 'Fulfilled',
    placedAt: '2026-11-09T10:15:00Z',
    cardHoldStatus: 'captured',
    qboStatus: 'synced',
  },
  {
    id: 'SCR-1039',
    customerName: 'Citrus Grove Equestrian',
    locationId: 'fm',
    lines: [{ skuId: 'sku-care-fly-spray', qty: 6, picked: true }],
    total: 109.5,
    status: 'Fulfilled',
    placedAt: '2026-11-13T11:48:00Z',
    cardHoldStatus: 'captured',
    qboStatus: 'failed',
  },
];

export const SEED_HAY_ROWS: HayRow[] = [
  {
    id: 'row-fm-3',
    locationId: 'fm',
    label: 'Row 3 — Coastal Hay',
    skuId: 'sku-hay-coastal',
    bales: 342,
    capacity: 500,
    qrPayload: './#/q/fort-myers/row-fm-3',
  },
  {
    id: 'row-fm-pb',
    locationId: 'fm',
    label: 'Pallet Bay B — Alfalfa',
    skuId: 'sku-hay-alfalfa-pallet',
    bales: 14,
    capacity: 30,
    qrPayload: './#/q/fort-myers/row-fm-pb',
  },
  {
    id: 'row-lb-3',
    locationId: 'lb',
    label: 'Row 3 — Coastal Hay',
    skuId: 'sku-hay-coastal',
    bales: 189,
    capacity: 400,
    qrPayload: './#/q/labelle/row-lb-3',
  },
  {
    id: 'row-lb-1',
    locationId: 'lb',
    label: 'Row 1 — Coastal Hay',
    skuId: 'sku-hay-coastal',
    bales: 96,
    capacity: 250,
    qrPayload: './#/q/labelle/row-lb-1',
  },
];

export function buildSeedAnnouncements(): Announcement[] {
  return [
    {
      id: 'ann-1',
      at: '2026-11-15T09:00:00Z',
      author: 'Al Curry',
      title: 'New alfalfa cut lands Friday',
      body: 'First-cutting alfalfa from the Hendry County lease arrives Friday morning. Stars Club members can reserve pallets by reorder before Thursday 6 PM.',
    },
    {
      id: 'ann-2',
      at: '2026-11-12T15:30:00Z',
      author: 'Al Curry',
      title: 'Winter hours start Dec 1',
      body: 'Both stores close at 6 PM through February. Delivery routes move to Tue/Fri — order by 6 PM the day before to make the truck.',
    },
  ];
}

const minutesAgo = (m: number) => new Date(Date.now() - 1000 * 60 * m).toISOString();

export function buildSeedFeed() {
  return [
    {
      id: 'feed-seed-1',
      at: minutesAgo(8),
      text: 'QBO · Fort Myers store (#5123) — walk-in sale SCR-1041 · Sweet Feed 50lb ×4 · $111.96',
      tone: 'qbo' as const,
    },
    {
      id: 'feed-seed-2',
      at: minutesAgo(6),
      text: 'Stripe terminal — card present, $111.96 captured',
      tone: 'terminal' as const,
    },
    {
      id: 'feed-seed-3',
      at: minutesAgo(5),
      text: 'Synder — order queued for QuickBooks ledger sync',
      tone: 'sync' as const,
    },
  ];
}

export function buildSeedAudit(): AuditEntry[] {
  return [
    {
      id: 'aud-1',
      at: '2026-11-15T14:31:00Z',
      actor: 'System (GHL Workflow)',
      action: 'SMS receipt sent',
      detail: 'Order SCR-1045 hold confirmation to Rebecca O. (+1-863-***-0142)',
    },
    {
      id: 'aud-2',
      at: '2026-11-15T13:58:00Z',
      actor: 'Ranch Hand — Cody',
      action: 'Stock adjusted',
      detail: 'Fort Myers / Sweet Feed 50lb: -4 bags (counter sale SCR-1041)',
    },
    {
      id: 'aud-3',
      at: '2026-11-15T12:40:00Z',
      actor: 'Synder sync',
      action: 'QBO ledger entry',
      detail: 'Invoice #INV-2214 posted · Pine Hollow Stables · $744.00',
    },
    {
      id: 'aud-4',
      at: '2026-11-15T11:15:00Z',
      actor: 'Ranch Hand — Cody',
      action: 'Substitution approved',
      detail: 'SCR-1037: Sweet Feed 50lb -> Equine Senior 50lb (customer consent via SMS)',
    },
    {
      id: 'aud-5',
      at: '2026-11-14T16:05:00Z',
      actor: 'QRapid scan',
      action: 'Bulk intake',
      detail: './#/q/fort-myers/row-fm-3 · +50 bales logged by Cody',
    },
  ];
}

export const STATUS_BADGE: Record<string, string> = {
  Picking: 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/15',
  'Awaiting Approval': 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/15',
  'Out for Delivery': 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15',
  Fulfilled: 'bg-zinc-700/40 text-zinc-400 hover:bg-zinc-700/40',
  'Queued for QBO': 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/15',
};

/* ------------------------------------------------------------------ */
/* Delivery zones — trucks run Tuesday & Friday. Orders confirmed by   */
/* 6 PM the day before make the next run; else they roll to the one    */
/* after (the week boundary).                                          */
/* ------------------------------------------------------------------ */

export const DELIVERY_DAYS = [2, 5]; // Tue, Fri (Date.getDay())
export const ORDER_CUTOFF_HOUR = 18;

export function nextDeliveryDay(from: Date = new Date()): Date {
  const candidate = new Date(from);
  for (let i = 0; i < 8; i++) {
    const day = new Date(candidate);
    day.setDate(candidate.getDate() + i);
    const isDeliveryDay = DELIVERY_DAYS.includes(day.getDay());
    if (!isDeliveryDay) continue;
    if (i === 0 && from.getHours() >= ORDER_CUTOFF_HOUR) continue; // missed today's truck
    day.setHours(9, 0, 0, 0);
    return day;
  }
  return candidate;
}
