export type Role = 'admin' | 'staff' | 'customer';

export type Plan = 'free' | 'stars';

export interface Location {
  id: string;
  name: string;
  short: string;
  address: string;
  /** Each store runs its own QuickBooks company file. */
  qboCompany: string;
}

export interface Sku {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  reorderPoint: number;
  /** Physical units on the shelf. */
  stock: Record<string, number>;
  /** Units reserved by open pick tickets. */
  reserved: Record<string, number>;
}

export interface OrderLine {
  skuId: string;
  qty: number;
  substitutedWith?: string;
  picked?: boolean;
}

export type CardHoldStatus = 'pending' | 'authorized' | 'captured' | 'failed';

export type OrderStatus =
  | 'Picking'
  | 'Awaiting Approval'
  | 'Out for Delivery'
  | 'Fulfilled'
  | 'Queued for QBO';

export type QboStatus = 'pending' | 'synced' | 'failed';

export interface SubstitutionProposal {
  lineIdx: number;
  proposedSkuId: string;
  status: 'proposed' | 'approved' | 'declined';
}

export interface Order {
  id: string;
  customerName: string;
  memberId?: string;
  locationId: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  placedAt: string;
  cardHoldStatus: CardHoldStatus;
  qboStatus: QboStatus;
  substitution?: SubstitutionProposal;
}

export interface Member {
  id: string;
  name: string;
  plan: Plan;
  memberSince?: string;
  /** Rewards Fund balance — accrues a % of every captured order. */
  rewardsFund: number;
  locationId: string;
  frequentSkuIds: string[];
  cardLast4?: string;
}

export interface HayRow {
  id: string;
  locationId: string;
  label: string;
  skuId: string;
  bales: number;
  capacity: number;
  /** Printable web link — deep-links into the hub's intake dialog. */
  qrPayload: string;
}

export interface Announcement {
  id: string;
  at: string;
  author: string;
  title: string;
  body: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface ToastItem {
  id: number;
  tone: 'success' | 'info' | 'warn';
  title: string;
  description?: string;
}

export interface FeedItem {
  id: string;
  at: string;
  text: string;
  tone: 'qbo' | 'terminal' | 'sync';
}
