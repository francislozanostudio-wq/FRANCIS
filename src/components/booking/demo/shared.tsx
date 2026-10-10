import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { CalendarCheck, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/lib/translations';

export interface DemoService {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  is_active: boolean;
  display_order: number;
}

export interface DemoClientInfo {
  fullName: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY_INFO: DemoClientInfo = { fullName: '', email: '', phone: '', notes: '' };

// Fallback data (same as the studio seed) so the demo always renders,
// even if Supabase is unreachable from the browser.
const FALLBACK_SERVICES: DemoService[] = [
  { id: 'seed-1', name: 'Classic Manicure', description: 'Traditional nail care with cuticle work, shaping, and polish', price: 45, duration: 45, category: 'manicures', is_active: true, display_order: 1 },
  { id: 'seed-2', name: 'Luxury Spa Manicure', description: 'Premium service with exfoliation, massage, and hydrating treatment', price: 65, duration: 60, category: 'manicures', is_active: true, display_order: 2 },
  { id: 'seed-3', name: 'Classic Pedicure', description: 'Complete foot care with callus removal, massage, and polish', price: 55, duration: 60, category: 'pedicures', is_active: true, display_order: 3 },
  { id: 'seed-4', name: 'Luxury Spa Pedicure', description: 'Ultimate pampering with advanced treatments and extended massage', price: 75, duration: 75, category: 'pedicures', is_active: true, display_order: 4 },
  { id: 'seed-5', name: 'Gel-X Extensions', description: 'Lightweight, durable extensions with natural look and feel', price: 85, duration: 90, category: 'extensions', is_active: true, display_order: 5 },
  { id: 'seed-6', name: 'Acrylic Extensions', description: 'Strong, long-lasting extensions perfect for dramatic length', price: 75, duration: 90, category: 'extensions', is_active: true, display_order: 6 },
  { id: 'seed-7', name: 'Dip Powder System', description: 'Chip-resistant color system for natural or short extensions', price: 65, duration: 75, category: 'systems', is_active: true, display_order: 7 },
  { id: 'seed-8', name: 'Builder Gel Overlay', description: 'Strengthening overlay for natural nails with added durability', price: 55, duration: 60, category: 'systems', is_active: true, display_order: 8 },
  { id: 'seed-9', name: 'Simple Nail Art', description: 'Accent nails, French variations, basic patterns, and solid colors', price: 25, duration: 30, category: 'nail-art', is_active: true, display_order: 9 },
  { id: 'seed-10', name: 'Detailed Nail Art', description: 'Hand-painted designs, florals, geometric patterns, and chrome finishes', price: 45, duration: 45, category: 'nail-art', is_active: true, display_order: 10 },
  { id: 'seed-11', name: 'Intricate Nail Art', description: 'Complex 3D art, encapsulated designs, foils, and custom masterpieces', price: 75, duration: 60, category: 'nail-art', is_active: true, display_order: 11 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  manicures: 'Manicures',
  pedicures: 'Pedicures',
  extensions: 'Extensions',
  systems: 'Nail Systems',
  'nail-art': 'Nail Art',
  'add-ons': 'Add-Ons',
  general: 'General',
};

export const categoryLabel = (category: string) =>
  CATEGORY_LABELS[category] ||
  category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

// Studio hours: Mon-Sat, 7 AM - 5 PM (lunch 1-2 PM excluded)
export const TIME_SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export interface Slot {
  time: string;
  isBooked: boolean;
}

// Deterministic pseudo-availability so every date looks realistically busy
// without needing a real bookings query (this is a visual demo only).
export const slotsForDate = (date?: Date): Slot[] => {
  if (!date) return [];
  const seed = hashString(format(date, 'yyyy-MM-dd'));
  const booked = new Set<string>();
  const count = 2 + (seed % 3);
  let cursor = seed;
  for (let i = 0; i < count; i++) {
    cursor = (cursor * 31 + 17) % TIME_SLOTS.length;
    booked.add(TIME_SLOTS[cursor]);
  }
  return TIME_SLOTS.map((time) => ({ time, isBooked: booked.has(time) }));
};

export const isDateDisabled = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today || date.getDay() === 0; // studio closed Sundays
};

export const upcomingDays = (count = 21): Date[] => {
  const days: Date[] = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (!isDateDisabled(cursor)) days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
};

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useDemoServices() {
  const [services, setServices] = useState<DemoService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        if (!active) return;
        if (error || !data || data.length === 0) {
          setServices(FALLBACK_SERVICES);
        } else {
          setServices(data as DemoService[]);
        }
      } catch {
        if (active) setServices(FALLBACK_SERVICES);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return { services, isLoading };
}

export interface DemoBooking {
  services: DemoService[];
  isLoading: boolean;
  selectedIds: string[];
  selectedServices: DemoService[];
  isSelected: (id: string) => boolean;
  toggleService: (id: string) => void;
  selectOnly: (id: string) => void;
  date?: Date;
  selectDate: (date?: Date) => void;
  time?: string;
  selectTime: (time?: string) => void;
  info: DemoClientInfo;
  setInfoField: (field: keyof DemoClientInfo, value: string) => void;
  total: number;
  duration: number;
  servicesReady: boolean;
  dateReady: boolean;
  detailsReady: boolean;
  readyToConfirm: boolean;
  confirmation: string | null;
  confirm: () => void;
  restart: () => void;
}

// One shared state object for all 5 demo styles, so selections
// follow the client while they switch between layouts.
export function useDemoBooking(): DemoBooking {
  const { services, isLoading } = useDemoServices();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<DemoClientInfo>(EMPTY_INFO);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds]
  );

  const toggleService = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectOnly = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.length === 1 && prev[0] === id ? [] : [id]));
  }, []);

  const selectDate = useCallback((next?: Date) => {
    setDate(next);
    setTime(undefined);
  }, []);

  const setInfoField = useCallback((field: keyof DemoClientInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
  const servicesReady = selectedIds.length > 0;
  const dateReady = Boolean(date && time);
  const detailsReady =
    info.fullName.trim().length >= 2 &&
    EMAIL_RE.test(info.email.trim()) &&
    info.phone.replace(/\D/g, '').length >= 10;

  const confirm = useCallback(() => {
    setConfirmation('FNA-' + Math.random().toString(36).slice(2, 11).toUpperCase());
  }, []);

  const restart = useCallback(() => {
    setSelectedIds([]);
    setDate(undefined);
    setTime(undefined);
    setInfo(EMPTY_INFO);
    setConfirmation(null);
  }, []);

  return {
    services,
    isLoading,
    selectedIds,
    selectedServices,
    isSelected: (id: string) => selectedIds.includes(id),
    toggleService,
    selectOnly,
    date,
    selectDate,
    time,
    selectTime: setTime,
    info,
    setInfoField,
    total,
    duration,
    servicesReady,
    dateReady,
    detailsReady,
    readyToConfirm: servicesReady && dateReady && detailsReady,
    confirmation,
    confirm,
    restart,
  };
}

/* ------------------------------------------------------------------ */
/* Shared presentational pieces                                        */
/* ------------------------------------------------------------------ */

export function DemoLoader({ label = 'Loading services…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function DemoCheck({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
        checked ? 'border-accent bg-accent text-luxury-black' : 'border-muted-foreground/50 text-transparent',
        className
      )}
    >
      <Check size={14} strokeWidth={3} />
    </span>
  );
}

interface DateStripProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  days?: number;
  large?: boolean;
}

export function DateStrip({ selected, onSelect, days = 21, large = false }: DateStripProps) {
  const options = useMemo(() => upcomingDays(days), [days]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-none">
      {options.map((date) => {
        const active = selected ? isSameDay(date, selected) : false;
        return (
          <button
            key={date.toISOString()}
            type="button"
            onClick={() => onSelect(date)}
            className={cn(
              'snap-start shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all duration-200',
              large ? 'min-w-[68px] py-3' : 'min-w-[58px] py-2.5',
              active
                ? 'border-accent bg-gradient-gold text-luxury-black shadow-gold'
                : 'border-border bg-card text-foreground hover:border-accent/60'
            )}
          >
            <span className={cn('font-medium uppercase', large ? 'text-[11px]' : 'text-[10px]')}>
              {format(date, 'EEE')}
            </span>
            <span className={cn('font-heading font-bold leading-tight', large ? 'text-2xl' : 'text-lg')}>
              {format(date, 'd')}
            </span>
            <span className={cn('uppercase opacity-70', large ? 'text-[11px]' : 'text-[10px]')}>
              {format(date, 'MMM')}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface TimePillsProps {
  date?: Date;
  selected?: string;
  onSelect: (time: string) => void;
  columns?: 2 | 3 | 4;
}

export function TimePills({ date, selected, onSelect, columns = 3 }: TimePillsProps) {
  if (!date) {
    return (
      <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border px-4 py-6 text-center">
        Pick a date to see available times
      </p>
    );
  }

  const slots = slotsForDate(date);

  return (
    <div className={cn('grid gap-2', columns === 2 && 'grid-cols-2', columns === 3 && 'grid-cols-3', columns === 4 && 'grid-cols-2 sm:grid-cols-4')}>
      {slots.map((slot) => {
        const active = selected === slot.time;
        return (
          <button
            key={slot.time}
            type="button"
            disabled={slot.isBooked}
            onClick={() => onSelect(slot.time)}
            className={cn(
              'rounded-lg border px-2 py-2.5 text-sm font-medium transition-all duration-200',
              slot.isBooked &&
                'border-border bg-muted text-muted-foreground/60 line-through cursor-not-allowed',
              !slot.isBooked && active && 'border-accent bg-gradient-gold text-luxury-black shadow-gold',
              !slot.isBooked && !active && 'border-border bg-card hover:border-accent/60 hover:text-accent'
            )}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}

interface DetailsFieldsProps {
  info: DemoClientInfo;
  onChange: (field: keyof DemoClientInfo, value: string) => void;
  showNotes?: boolean;
}

export function DetailsFields({ info, onChange, showNotes = true }: DetailsFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="demo-full-name">Full name *</Label>
        <Input
          id="demo-full-name"
          value={info.fullName}
          onChange={(event) => onChange('fullName', event.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-phone">Phone *</Label>
        <Input
          id="demo-phone"
          type="tel"
          value={info.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          placeholder="+1 737-378-5755"
          autoComplete="tel"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="demo-email">Email *</Label>
        <Input
          id="demo-email"
          type="email"
          value={info.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      {showNotes && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="demo-notes">Notes (optional)</Label>
          <Textarea
            id="demo-notes"
            value={info.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            placeholder="Allergies, design ideas, special requests…"
            className="min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
}

interface SummaryProps {
  booking: DemoBooking;
  compact?: boolean;
}

export function SelectionSummary({ booking, compact = false }: SummaryProps) {
  const { translateByText } = useTranslations();

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-3'}>
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm text-muted-foreground">Service{booking.selectedServices.length !== 1 ? 's' : ''}</span>
        <span className="text-sm text-right font-medium text-card-foreground">
          {booking.selectedServices.length
            ? booking.selectedServices.map((service) => translateByText(service.name)).join(', ')
            : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Date</span>
        <span className="text-sm font-medium text-card-foreground">
          {booking.date ? format(booking.date, 'EEE, MMM d') : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Time</span>
        <span className="text-sm font-medium text-card-foreground">{booking.time ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Duration</span>
        <span className="text-sm font-medium text-card-foreground">
          {booking.duration ? formatDuration(booking.duration) : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
        <span className="text-sm font-medium text-card-foreground">Total</span>
        <span className="font-heading text-xl font-bold text-accent">${booking.total}</span>
      </div>
    </div>
  );
}

interface ConfirmationProps {
  booking: DemoBooking;
  styleName: string;
}

export function DemoConfirmation({ booking, styleName }: ConfirmationProps) {
  const { translateByText } = useTranslations();

  return (
    <div className="mx-auto max-w-md text-center animate-fade-in">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold animate-scale-in">
        <Check size={32} className="text-luxury-black" strokeWidth={3} />
      </div>
      <h2 className="font-heading text-3xl font-bold text-foreground mb-2">You're booked!</h2>
      <p className="text-muted-foreground mb-6">
        Confirmation <span className="text-accent font-semibold">#{booking.confirmation}</span>
      </p>

      <div className="rounded-2xl border border-border bg-card p-5 text-left shadow-elegant">
        <div className="flex items-start gap-3 pb-3 border-b border-border">
          <CalendarCheck size={20} className="text-accent mt-0.5" />
          <div>
            <p className="font-medium text-card-foreground">
              {booking.date && booking.time
                ? `${format(booking.date, 'EEEE, MMMM d')} at ${booking.time}`
                : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.selectedServices.map((service) => translateByText(service.name)).join(' + ')}
            </p>
          </div>
          <span className="ml-auto font-heading font-bold text-accent">${booking.total}</span>
        </div>
        <div className="pt-3 space-y-1 text-sm text-muted-foreground">
          <p>{booking.info.fullName}</p>
          <p>{booking.info.email}</p>
          <p>{booking.info.phone}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Demo preview ({styleName}) — nothing was saved or emailed.
      </p>

      <Button
        variant="outline"
        className="mt-6 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
        onClick={booking.restart}
      >
        <RotateCcw size={16} className="mr-2" />
        Start over
      </Button>
    </div>
  );
}
