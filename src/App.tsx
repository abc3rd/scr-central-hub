import { useEffect } from 'react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Header } from '@/components/common/Header';
import { Toasts } from '@/components/common/Toasts';
import { CustomerPortal } from '@/components/customer/CustomerPortal';
import { StaffDashboard } from '@/components/staff/StaffDashboard';
import { AppProvider, useApp } from '@/lib/store';
import type { Role } from '@/lib/types';

function RoleView({ role }: { role: Role }) {
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'staff') return <StaffDashboard />;
  return <CustomerPortal />;
}

const SLUG_TO_LOC: Record<string, string> = {
  'fort-myers': 'fm',
  fm: 'fm',
  labelle: 'lb',
  lb: 'lb',
};

// Hay-row QR tags encode web links — ./#/q/<store-slug>/<rowId> — so a phone
// camera opens the hub straight into the intake flow for that row.
function Shell() {
  const { role, setRole, setActiveLocationId, openQrIntake, pushToast, hayRows } = useApp();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#/q/')) return;
    const [slug, rowId] = hash
      .slice(4)
      .split('/')
      .filter(Boolean);
    const loc = SLUG_TO_LOC[slug?.toLowerCase() ?? ''];
    const row = hayRows.find((r) => r.id.toLowerCase() === rowId?.toLowerCase());
    if (loc && row) {
      setRole('staff');
      setActiveLocationId(loc);
      openQrIntake(row.id);
    } else {
      pushToast({
        tone: 'warn',
        title: 'Unrecognized QR link',
        description: `No hay row at "${slug}/${rowId}". Opened the hub normally.`,
      });
    }
    // Clean the URL so a reload doesn't replay the intake modal.
    history.replaceState(null, '', window.location.pathname + window.location.search);
    // Only parse once, on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
      <Header />
      <main>
        <RoleView role={role} />
      </main>
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
