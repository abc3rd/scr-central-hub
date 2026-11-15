import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  buildSeedAnnouncements,
  buildSeedAudit,
  LOCATIONS,
  SEED_HAY_ROWS,
  SEED_MEMBERS,
  SEED_ORDERS,
  SEED_SKUS,
} from './data';
import type {
  Announcement,
  AuditEntry,
  HayRow,
  Location,
  Member,
  Order,
  Role,
  Sku,
  ToastItem,
} from './types';

const STORAGE_KEY = 'scr-hub-v3';
const AUDIT_CAP = 150;

interface PersistedState {
  version: number;
  role: Role;
  activeLocationId: string;
  skus: Sku[];
  orders: Order[];
  hayRows: HayRow[];
  members: Member[];
  audit: AuditEntry[];
  announcements: Announcement[];
}

function seedState(): Omit<PersistedState, 'version'> {
  // Seed reservations must match the open pick tickets in SEED_ORDERS.
  const skus = SEED_SKUS.map((s) => ({ ...s, reserved: { ...s.reserved } }));
  for (const order of SEED_ORDERS) {
    if (order.status !== 'Picking' && order.status !== 'Awaiting Approval') continue;
    for (const line of order.lines) {
      const sku = skus.find((s) => s.id === line.skuId);
      if (sku) sku.reserved[order.locationId] = (sku.reserved[order.locationId] ?? 0) + line.qty;
    }
  }
  return {
    role: 'admin',
    activeLocationId: LOCATIONS[0].id,
    skus,
    orders: SEED_ORDERS.map((o) => ({ ...o, lines: o.lines.map((l) => ({ ...l })) })),
    hayRows: SEED_HAY_ROWS,
    members: SEED_MEMBERS,
    audit: buildSeedAudit(),
    announcements: buildSeedAnnouncements(),
  };
}

function loadState(): Omit<PersistedState, 'version'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== 3 || !Array.isArray(parsed.skus) || !Array.isArray(parsed.orders)) {
      return seedState();
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function getSku(skus: Sku[], skuId: string): Sku {
  const sku = skus.find((s) => s.id === skuId);
  if (!sku) throw new Error(`Unknown SKU ${skuId}`);
  return sku;
}

export function getLocation(locationId: string): Location {
  const loc = LOCATIONS.find((l) => l.id === locationId);
  if (!loc) throw new Error(`Unknown location ${locationId}`);
  return loc;
}

export function availableStock(sku: Sku, locationId: string): number {
  return Math.max(0, (sku.stock[locationId] ?? 0) - (sku.reserved[locationId] ?? 0));
}

/** Next sequential order id derived from the existing ledger — never random. */
export function nextOrderId(orders: Order[]): string {
  const max = orders.reduce((acc, o) => {
    const n = parseInt(o.id.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 1040);
  return `SCR-${max + 1}`;
}

export function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  roleLabel: string;
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
  locations: Location[];
  skus: Sku[];
  adjustStock: (skuId: string, locationId: string, delta: number) => void;
  setStock: (skuId: string, locationId: string, value: number) => void;
  reserveStock: (skuId: string, locationId: string, delta: number) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, patch: Partial<Order>) => void;
  setLinePicked: (orderId: string, lineIdx: number, picked: boolean) => void;
  hayRows: HayRow[];
  adjustHayRow: (rowId: string, deltaBales: number) => void;
  intakeHayRow: (rowId: string, bales: number) => number;
  members: Member[];
  joinStars: (memberId: string) => void;
  accrueReward: (memberId: string, amount: number) => void;
  audit: AuditEntry[];
  logAudit: (actor: string, action: string, detail: string) => void;
  announcements: Announcement[];
  postAnnouncement: (author: string, title: string, body: string) => void;
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => void;
  // Deep-link QR intake: App parses #/q/<store>/<rowId> and parks the row here;
  // QRapidScanner picks it up and opens the intake modal.
  pendingQrRowId: string | null;
  openQrIntake: (rowId: string) => void;
  clearQrIntake: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Al Curry (Owner / Admin)',
  staff: 'Ranch Hand / Staff',
  customer: 'SCR Portal',
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadState);
  const [role, setRole] = useState<Role>(initial.role);
  const [activeLocationId, setActiveLocationId] = useState(initial.activeLocationId);
  const [skus, setSkus] = useState<Sku[]>(initial.skus);
  const [orders, setOrders] = useState<Order[]>(initial.orders);
  const [hayRows, setHayRows] = useState<HayRow[]>(initial.hayRows);
  const [members, setMembers] = useState<Member[]>(initial.members);
  const [audit, setAudit] = useState<AuditEntry[]>(initial.audit);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initial.announcements);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingQrRowId, setPendingQrRowId] = useState<string | null>(null);

  const openQrIntake = useCallback((rowId: string) => setPendingQrRowId(rowId), []);
  const clearQrIntake = useCallback(() => setPendingQrRowId(null), []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const state: PersistedState = {
          version: 3,
          role,
          activeLocationId,
          skus,
          orders,
          hayRows,
          members,
          audit,
          announcements,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage full or unavailable — demo keeps running in memory
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [role, activeLocationId, skus, orders, hayRows, members, audit, announcements]);

  const toastTimers = useRef<number[]>([]);
  useEffect(
    () => () => {
      toastTimers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastSeq = useRef(1);
  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = toastSeq.current++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
    toastTimers.current.push(timer);
  }, []);

  const adjustStock = useCallback((skuId: string, locationId: string, delta: number) => {
    setSkus((prev) =>
      prev.map((s) =>
        s.id === skuId
          ? { ...s, stock: { ...s.stock, [locationId]: Math.max(0, (s.stock[locationId] ?? 0) + delta) } }
          : s,
      ),
    );
  }, []);

  const setStock = useCallback((skuId: string, locationId: string, value: number) => {
    setSkus((prev) =>
      prev.map((s) =>
        s.id === skuId ? { ...s, stock: { ...s.stock, [locationId]: Math.max(0, value) } } : s,
      ),
    );
  }, []);

  const reserveStock = useCallback((skuId: string, locationId: string, delta: number) => {
    setSkus((prev) =>
      prev.map((s) =>
        s.id === skuId
          ? {
              ...s,
              reserved: {
                ...s.reserved,
                [locationId]: Math.max(0, (s.reserved[locationId] ?? 0) + delta),
              },
            }
          : s,
      ),
    );
  }, []);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const updateOrder = useCallback((orderId: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
  }, []);

  const setLinePicked = useCallback((orderId: string, lineIdx: number, picked: boolean) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, lines: o.lines.map((l, i) => (i === lineIdx ? { ...l, picked } : l)) }
          : o,
      ),
    );
  }, []);

  const adjustHayRow = useCallback((rowId: string, deltaBales: number) => {
    setHayRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const bales = Math.min(row.capacity, Math.max(0, row.bales + deltaBales));
        return { ...row, bales };
      }),
    );
  }, []);

  const intakeHayRow = useCallback(
    (rowId: string, bales: number) => {
      const row = hayRows.find((r) => r.id === rowId);
      const applied = Math.min(row?.capacity ?? 0, bales);
      adjustHayRow(rowId, applied);
      if (row) adjustStock(row.skuId, row.locationId, applied);
      return applied;
    },
    [hayRows, adjustHayRow, adjustStock],
  );

  const logAudit = useCallback((actor: string, action: string, detail: string) => {
    setAudit((prev) =>
      [
        {
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          actor,
          action,
          detail,
        },
        ...prev,
      ].slice(0, AUDIT_CAP),
    );
  }, []);

  const joinStars = useCallback(
    (memberId: string) => {
      const last4 = String(Math.floor(1000 + Math.random() * 9000));
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                plan: 'stars',
                memberSince: new Date().toISOString().slice(0, 10),
                cardLast4: m.cardLast4 ?? last4,
              }
            : m,
        ),
      );
      const member = members.find((m) => m.id === memberId);
      if (member) {
        logAudit('SCR Stars Club', 'Membership started', `${member.name} joined Stars Club ($9.99/mo)`);
      }
    },
    [members, logAudit],
  );

  const accrueReward = useCallback((memberId: string, amount: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, rewardsFund: Math.round((m.rewardsFund + amount) * 100) / 100 }
          : m,
      ),
    );
  }, []);

  const postAnnouncement = useCallback(
    (author: string, title: string, body: string) => {
      setAnnouncements((prev) =>
        [
          {
            id: `ann-${Date.now()}`,
            at: new Date().toISOString(),
            author,
            title,
            body,
          },
          ...prev,
        ].slice(0, 50),
      );
      logAudit('GHL Broadcast', 'Hay Announcement posted', `"${title}" queued for SMS + customer feed`);
    },
    [logAudit],
  );

  const resetDemo = useCallback(() => {
    const fresh = seedState();
    setRole(fresh.role);
    setActiveLocationId(fresh.activeLocationId);
    setSkus(fresh.skus);
    setOrders(fresh.orders);
    setHayRows(fresh.hayRows);
    setMembers(fresh.members);
    setAudit(fresh.audit);
    setAnnouncements(fresh.announcements);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      role,
      setRole,
      roleLabel: ROLE_LABELS[role],
      activeLocationId,
      setActiveLocationId,
      locations: LOCATIONS,
      skus,
      adjustStock,
      setStock,
      reserveStock,
      orders,
      addOrder,
      updateOrder,
      setLinePicked,
      hayRows,
      adjustHayRow,
      intakeHayRow,
      members,
      joinStars,
      accrueReward,
      audit,
      logAudit,
      announcements,
      postAnnouncement,
      toasts,
      pushToast,
      dismissToast,
      resetDemo,
      pendingQrRowId,
      openQrIntake,
      clearQrIntake,
    }),
    [
      role,
      activeLocationId,
      skus,
      adjustStock,
      setStock,
      reserveStock,
      orders,
      addOrder,
      updateOrder,
      setLinePicked,
      hayRows,
      adjustHayRow,
      intakeHayRow,
      members,
      joinStars,
      accrueReward,
      audit,
      logAudit,
      announcements,
      postAnnouncement,
      toasts,
      pushToast,
      dismissToast,
      resetDemo,
      pendingQrRowId,
      openQrIntake,
      clearQrIntake,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
