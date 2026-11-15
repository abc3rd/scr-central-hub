import { RotateCcw, ShieldCheck, UserRound, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/lib/store';
import type { Role } from '@/lib/types';

const ROLE_ICONS: Record<Role, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  admin: ShieldCheck,
  staff: Wrench,
  customer: UserRound,
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Al Curry (Owner / Admin)' },
  { value: 'staff', label: 'Ranch Hand / Staff' },
  { value: 'customer', label: 'SCR Stars Club Member' },
];

export function Header() {
  const {
    role,
    setRole,
    roleLabel,
    activeLocationId,
    setActiveLocationId,
    locations,
    resetDemo,
    pushToast,
  } = useApp();
  const RoleIcon = ROLE_ICONS[role];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/40">
            <RoleIcon className="h-4 w-4 text-emerald-400" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-zinc-100">SCR Central Hub</p>
            <p className="truncate text-xs text-zinc-500">QRapid™ Ecosystem · {roleLabel}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="location-select" className="hidden text-xs text-zinc-500 sm:block">
            Location
          </label>
          <Select value={activeLocationId} onValueChange={setActiveLocationId}>
            <SelectTrigger
              id="location-select"
              className="h-9 w-[7.5rem] bg-zinc-900 text-xs sm:w-36"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label htmlFor="role-select" className="hidden text-xs text-zinc-500 sm:block">
            View as
          </label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger
              id="role-select"
              className="h-9 w-40 bg-zinc-900 text-xs sm:w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            aria-label="Reset demo data"
            title="Reset demo data"
            className="h-9 w-9 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => {
              resetDemo();
              pushToast({
                tone: 'info',
                title: 'Demo reset',
                description: 'Inventory, orders, members and audit trail restored to seed data.',
              });
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
