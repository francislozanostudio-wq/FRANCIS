import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { 
  ArrowDown, 
  Check, 
  CalendarCheck, 
  RotateCcw, 
  Calendar, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Coffee,
  X,
  Layers,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { sendBookingEmail } from '@/lib/emailService';
import { getStudioSettings } from '@/lib/studioService';
import { useTranslations } from '@/lib/translations';
import {
  getAvailabilityConfig,
  calculateSlotsForDate,
  DEFAULT_AVAILABILITY_CONFIG,
  type AvailabilityConfig,
  type ComputedSlot,
  type ExistingBookingSlot,
} from '@/lib/availabilityService';

/* ─── Spanish Date Constants ─── */
const SPANISH_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SPANISH_FULL_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SPANISH_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const SPANISH_FULL_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatSpanishDate(d: Date, full: boolean = false): string {
  const dayName = full ? SPANISH_FULL_DAYS[d.getDay()] : SPANISH_DAYS[d.getDay()];
  const monthName = full ? SPANISH_FULL_MONTHS[d.getMonth()] : SPANISH_MONTHS[d.getMonth()];
  return `${dayName}, ${d.getDate()} de ${monthName}`;
}

/* ─── Default Francis Lozano Services (Fallback & Real Baseline) ─── */
const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Manicura rusa combinada + Builder Gel + esmaltado semipermanente',
    description: 'Sobre uña natural. Incluye preparación rusa, manicura combinada, nivelación con Builder Gel y esmaltado semipermanente. (Precio inicial desde $70).',
    price: 70,
    duration: 120,
    category: 'manicures',
    is_active: true,
    display_order: 1,
  },
  {
    id: 'srv-2',
    name: 'Sistema Soft Gel',
    description: 'Aplicación completa de sistema Soft Gel. El precio final depende de largo, diseño y complejidad. Duración aproximada: 2 horas.',
    price: 80,
    duration: 120,
    category: 'systems',
    is_active: true,
    display_order: 2,
  },
  {
    id: 'srv-3',
    name: 'Pedicura rusa combinada',
    description: 'Servicio de pedicura detallada con técnica rusa/combinada para pies limpios, suaves y esmaltado impecable. Duración aproximada: 2 horas.',
    price: 60,
    duration: 120,
    category: 'pedicures',
    is_active: true,
    display_order: 3,
  },
  {
    id: 'srv-4',
    name: 'Pedi-Spa',
    description: 'Servicio completo de spa para pies con exfoliación, hidratación intensiva y técnica rusa. Duración aproximada: 3 horas.',
    price: 100,
    duration: 180,
    category: 'pedicures',
    is_active: true,
    display_order: 4,
  },
  {
    id: 'srv-5',
    name: 'Retiro de sistema',
    description: 'Retiro cuidadoso de producto artificial anterior sin dañar la uña natural. Duración: 45 minutos.',
    price: 20,
    duration: 45,
    category: 'add-ons',
    is_active: true,
    display_order: 5,
  },
  {
    id: 'srv-6',
    name: 'Keratina',
    description: 'Tratamiento alisador y restaurador de keratina. Precio desde $150 (cabello hasta la línea del sostén ~3 horas; cabello más largo o abundante ~4 a 5 horas).',
    price: 150,
    duration: 180,
    category: 'hair',
    is_active: true,
    display_order: 6,
  },
  {
    id: 'srv-7',
    name: 'Corte de puntas',
    description: 'Corte y mantenimiento de puntas saludables para dar vida y forma a tu cabello. Duración: 30 minutos.',
    price: 20,
    duration: 30,
    category: 'hair',
    is_active: true,
    display_order: 7,
  },
];

/* ─── Default Francis Lozano Add-Ons ─── */
const DEFAULT_ADDONS: AddOn[] = [
  {
    id: 'addon-removal',
    name: 'Retiro de producto previo / Clienta recurrente',
    description: 'Indispensable si tienes producto anterior que debe retirarse antes del nuevo set (+1 hora en agenda).',
    price: 20,
    duration: 60,
    is_active: true,
    display_order: 1,
  },
  {
    id: 'addon-art',
    name: 'Nail Art / Diseños / Diseños 3D',
    description: 'Diseño personalizado a mano alzada, 3D o pedrería (precio base; puede variar según dificultad).',
    price: 15,
    duration: 30,
    is_active: true,
    display_order: 2,
  },
  {
    id: 'addon-effects',
    name: 'Efectos especiales (Chrome, Cat Eye, Aurora)',
    description: 'Efecto espejo, ojo de gato, perlado o aurora en esmalte semipermanente.',
    price: 10,
    duration: 15,
    is_active: true,
    display_order: 3,
  },
  {
    id: 'addon-length',
    name: 'Largo Extra (Soft Gel)',
    description: 'Para set de Soft Gel largo o extra largo con mayor nivelación.',
    price: 10,
    duration: 15,
    is_active: true,
    display_order: 4,
  },
  {
    id: 'addon-hair-long',
    name: 'Cabello por debajo del sostén / Abundante (Keratina)',
    description: 'Para melenas largas o con mucho volumen (+1 a 2 horas adicionales en agenda).',
    price: 50,
    duration: 60,
    is_active: true,
    display_order: 5,
  },
];

/* ─── Types ─────────────────────────────────────────────────── */
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  is_active: boolean;
  display_order: number;
}

interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  is_active: boolean;
  display_order: number;
}

interface ClientInfo {
  fullName: string;
  email: string;
  phone: string;
  hasPriorProduct: 'no' | 'yes';
  clientType: 'new' | 'returning';
  notes: string;
}

const EMPTY_INFO: ClientInfo = {
  fullName: '',
  email: '',
  phone: '',
  hasPriorProduct: 'no',
  clientType: 'new',
  notes: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    manicures: 'Manicuras',
    pedicures: 'Pedicuras',
    systems: 'Sistemas Soft Gel',
    hair: 'Cabello',
    'add-ons': 'Retiro / Add-Ons',
    general: 'General',
  };
  return map[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
};

/* ─── DateStrip Component (Optimized for Mobile Touch) ──────── */
function DateStrip({
  selected,
  onSelect,
  config,
}: {
  selected?: Date;
  onSelect: (d: Date) => void;
  config: AvailabilityConfig;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const list: Date[] = [];
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    const blockedSet = new Set(config.blockedDates.map((b) => b.date));

    while (list.length < 28) {
      const dayOfWeek = cursor.getDay();
      const dateStr = format(cursor, 'yyyy-MM-dd');
      const daySchedule = config.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);

      // Only add open days that are not blocked
      if (daySchedule && daySchedule.isOpen && !blockedSet.has(dateStr)) {
        list.push(new Date(cursor));
      }
      cursor = addDays(cursor, 1);
    }
    return list;
  }, [config]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Date Header with Day and Navigation Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {selected ? (
            <span className="text-xs sm:text-sm font-semibold text-accent flex items-center gap-1.5 truncate">
              <Calendar size={14} className="shrink-0" />
              <span>{formatSpanishDate(selected, true)}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-accent shrink-0" />
              <span>Elige tu día preferido (desliza o usa flechas)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-accent/10 hover:text-accent text-muted-foreground transition-colors active:scale-95"
            aria-label="Días anteriores"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-accent/10 hover:text-accent text-muted-foreground transition-colors active:scale-95"
            aria-label="Siguientes días"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Date Scroll Strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-none touch-pan-x"
      >
        {days.map((date) => {
          const active = selected ? isSameDay(date, selected) : false;
          const dayName = SPANISH_DAYS[date.getDay()];
          const monthName = SPANISH_MONTHS[date.getMonth()];
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                'snap-start shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all duration-200 min-w-[66px] sm:min-w-[72px] py-3 px-1.5 active:scale-95',
                active
                  ? 'border-accent bg-gradient-gold text-luxury-black shadow-gold ring-2 ring-accent scale-[1.02]'
                  : 'border-border bg-card text-foreground hover:border-accent/60 hover:bg-accent/5'
              )}
            >
              <span className="font-semibold uppercase text-[11px] tracking-wider">{dayName}</span>
              <span className="font-heading font-bold leading-tight text-xl sm:text-2xl my-0.5">{date.getDate()}</span>
              <span className="uppercase opacity-75 text-[10px] font-medium">{monthName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TimePills Component (Grouped & Phone-Optimized) ───────── */
function TimePills({
  date,
  selected,
  slots,
  isLoading,
  onSelect,
}: {
  date?: Date;
  selected?: string;
  slots: ComputedSlot[];
  isLoading: boolean;
  onSelect: (t: string) => void;
}) {
  if (!date) {
    return (
      <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs sm:text-sm text-muted-foreground bg-muted/20">
        <Clock className="mx-auto h-6 w-6 text-accent mb-2 opacity-60" />
        Selecciona una fecha arriba para ver los turnos disponibles.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs sm:text-sm text-muted-foreground gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent" />
        <span>Consultando disponibilidad en tiempo real…</span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 p-5 text-center text-xs sm:text-sm text-muted-foreground bg-card">
        <AlertCircle className="mx-auto h-6 w-6 text-amber-500 mb-2" />
        <p className="font-medium text-foreground">No hay turnos disponibles para esta fecha.</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          El servicio seleccionado no cabe en los bloques disponibles o ya está reservado. Por favor elige otro día.
        </p>
      </div>
    );
  }

  // Split into Morning (before 13:30) and Afternoon (from 15:00)
  const morningSlots = slots.filter((s) => s.time < '13:30');
  const afternoonSlots = slots.filter((s) => s.time >= '15:00');

  const renderSlotButton = (slot: ComputedSlot) => {
    const active = selected === slot.time;
    return (
      <button
        key={slot.time}
        type="button"
        disabled={slot.isBooked}
        onClick={() => onSelect(slot.time)}
        className={cn(
          'rounded-xl border px-2 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 min-h-[46px] active:scale-95',
          slot.isBooked
            ? 'border-border/40 bg-muted/40 text-muted-foreground/50 cursor-not-allowed line-through'
            : active
            ? 'border-accent bg-gradient-gold text-luxury-black shadow-gold scale-[1.02]'
            : 'border-border bg-card text-foreground hover:border-accent hover:text-accent hover:bg-accent/5'
        )}
      >
        <span>{slot.time}</span>
        {slot.isBooked && (
          <span className="text-[9px] font-normal no-underline opacity-80 leading-none">
            {slot.disabledReason || 'Ocupado'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Morning Block */}
      {morningSlots.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
            <Sun size={13} />
            <span>Bloque Mañana · 8:30 AM – 1:30 PM</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {morningSlots.map(renderSlotButton)}
          </div>
        </div>
      )}

      {/* Lunch pause banner */}
      <div className="flex items-center justify-center py-1">
        <span className="text-[11px] font-medium text-muted-foreground/80 px-3 py-1 rounded-full bg-muted/50 border border-border/50 flex items-center gap-1.5 text-center">
          <Coffee size={12} className="text-accent shrink-0" />
          Pausa del estudio: 1:30 PM – 3:00 PM (Cerrado)
        </span>
      </div>

      {/* Afternoon Block */}
      {afternoonSlots.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
            <Moon size={13} />
            <span>Bloque Tarde · 3:00 PM – ~7:00 PM</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {afternoonSlots.map(renderSlotButton)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Confirmation Screen ───────────────────────────────────── */
function ConfirmationScreen({
  confirmationNumber,
  serviceName,
  selectedAddOns,
  date,
  time,
  duration,
  total,
  info,
  depositAmount,
  onNewBooking,
}: {
  confirmationNumber: string;
  serviceName: string;
  selectedAddOns: AddOn[];
  date: Date;
  time: string;
  duration: number;
  total: number;
  info: ClientInfo;
  depositAmount: number;
  onNewBooking: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg text-center animate-fade-in py-6 sm:py-8 px-3 sm:px-4">
      <div className="mx-auto mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold animate-scale-in">
        <Check size={32} className="text-luxury-black sm:hidden" strokeWidth={3} />
        <Check size={40} className="text-luxury-black hidden sm:block" strokeWidth={3} />
      </div>

      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs mb-3 px-3 py-1">
        Cita Pre-Reservada con Éxito
      </Badge>

      <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground mb-2">
        ¡Tu cita está registrada!
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-5">
        Número de Confirmación:{' '}
        <span className="text-accent font-mono font-bold text-base sm:text-lg">#{confirmationNumber}</span>
      </p>

      {/* Details Box */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 text-left shadow-elegant mb-5 space-y-4">
        <div className="flex items-start gap-3 pb-3 border-b border-border">
          <CalendarCheck size={20} className="text-accent mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-card-foreground text-sm sm:text-base">
              {formatSpanishDate(date, true)}
            </p>
            <p className="text-xs sm:text-sm text-accent font-medium">
              {time} · Duración estimada: {formatDuration(duration)}
            </p>
          </div>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
            Servicio Principal
          </span>
          <p className="font-semibold text-card-foreground text-sm leading-snug">{serviceName}</p>
        </div>

        {selectedAddOns.length > 0 && (
          <div className="pt-2 border-t border-border">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
              Add-Ons y Diseños Adicionales ({selectedAddOns.length})
            </span>
            <div className="space-y-1">
              {selectedAddOns.map((addon) => (
                <div key={addon.id} className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate pr-2">• {addon.name}</span>
                  <span className="text-accent font-medium shrink-0">+${addon.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border flex justify-between items-baseline">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Estimado</span>
          <span className="font-heading text-2xl sm:text-3xl font-bold text-accent">${total}</span>
        </div>

        {/* Deposit reminder */}
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-accent">
            <ShieldCheck size={14} className="shrink-0" />
            <span>Condición de Reserva: Depósito de ${depositAmount}</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Para asegurar tu turno se requiere un depósito de ${depositAmount}. En breve recibirás las instrucciones completas en tu correo.
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        Hemos enviado un correo con todos los detalles a{' '}
        <span className="text-accent font-medium">{info.email}</span>.
      </p>

      <Button
        variant="outline"
        className="w-full sm:w-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground font-medium"
        onClick={onNewBooking}
      >
        <RotateCcw size={16} className="mr-2" />
        Hacer Otra Reserva
      </Button>
    </div>
  );
}

/* ─── Main ExpressBookingForm Component ──────────────────────── */
export function ExpressBookingForm() {
  const { toast } = useToast();

  /* State */
  const [config, setConfig] = useState<AvailabilityConfig>(DEFAULT_AVAILABILITY_CONFIG);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [addOns, setAddOns] = useState<AddOn[]>(DEFAULT_ADDONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<ComputedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [info, setInfo] = useState<ClientInfo>(EMPTY_INFO);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    number: string;
    service: string;
    addOns: AddOn[];
    duration: number;
    total: number;
  } | null>(null);

  /* Load Config, Services & Add-Ons */
  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      // 1. Availability Config
      const availConfig = await getAvailabilityConfig();
      if (active) setConfig(availConfig);

      // 2. Services from Supabase
      try {
        const { data: srvData, error: srvErr } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!srvErr && srvData && srvData.length > 0 && active) {
          setServices(srvData as Service[]);
        }
      } catch {
        // Fallback to DEFAULT_SERVICES
      }

      // 3. Add-Ons from Supabase
      try {
        const { data: addonData, error: addonErr } = await supabase
          .from('add_ons')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!addonErr && addonData && addonData.length > 0 && active) {
          setAddOns(addonData as AddOn[]);
        }
      } catch {
        // Fallback to DEFAULT_ADDONS
      }
    };

    loadAll();
    return () => {
      active = false;
    };
  }, []);

  /* Selected Service & Calculations */
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const selectedAddOnsList = useMemo(
    () => addOns.filter((a) => selectedAddOnIds.includes(a.id)),
    [addOns, selectedAddOnIds]
  );

  const servicePrice = selectedService?.price ?? 0;
  const addOnsTotal = selectedAddOnsList.reduce((sum, a) => sum + (a.price || 0), 0);
  const total = servicePrice + addOnsTotal;

  const serviceDuration = selectedService?.duration ?? 120;
  const addOnsDuration = selectedAddOnsList.reduce((sum, a) => sum + (a.duration || 0), 0);
  const totalDuration = serviceDuration + addOnsDuration;

  /* Filtered Services by Category */
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const categories = useMemo(() => [
    { key: 'all', label: `Todos (${services.length})` },
    { key: 'manicures', label: 'Manicuras' },
    { key: 'systems', label: 'Soft Gel' },
    { key: 'pedicures', label: 'Pedicuras' },
    { key: 'hair', label: 'Cabello' },
    { key: 'add-ons', label: 'Retiro' },
  ], [services.length]);

  /* Toggle Add-On */
  const toggleAddOn = useCallback((id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    // Reset time when duration changes so user re-validates slot fit
    setTime(undefined);
  }, []);

  /* Calculate Real Slots whenever Date or Duration changes */
  useEffect(() => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    let active = true;
    const fetchRealSlots = async () => {
      setIsLoadingSlots(true);
      const dateStr = format(date, 'yyyy-MM-dd');

      try {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('appointment_time, service_duration_total, status')
          .eq('appointment_date', dateStr)
          .in('status', ['confirmed']);

        if (!active) return;

        const existingSlots: ExistingBookingSlot[] = (bookingsData || []).map((b) => ({
          appointment_time: b.appointment_time,
          service_duration_total: b.service_duration_total,
          status: b.status,
        }));

        const computed = calculateSlotsForDate(
          date,
          totalDuration,
          config,
          existingSlots
        );

        setAvailableSlots(computed);
      } catch (err) {
        console.error('Error calculating slots:', err);
        if (active) {
          setAvailableSlots(calculateSlotsForDate(date, totalDuration, config, []));
        }
      } finally {
        if (active) setIsLoadingSlots(false);
      }
    };

    fetchRealSlots();
    return () => {
      active = false;
    };
  }, [date, totalDuration, config]);

  /* Form Validation */
  const dateReady = Boolean(date && time);
  const serviceReady = Boolean(selectedServiceId);
  const detailsReady =
    info.fullName.trim().length >= 2 &&
    EMAIL_RE.test(info.email.trim()) &&
    info.phone.replace(/\D/g, '').length >= 10;
  const readyToConfirm = dateReady && serviceReady && detailsReady;

  const setInfoField = useCallback((field: keyof ClientInfo, value: any) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectDate = useCallback((d: Date) => {
    setDate(d);
    setTime(undefined);
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowMobileDetails(false);
  };

  const actionLabel = !dateReady
    ? 'Elige Fecha y Hora'
    : !serviceReady
    ? 'Elige tu Servicio'
    : !detailsReady
    ? 'Completa tus Datos'
    : `Reservar Cita · $${total}`;

  const handleAction = () => {
    if (!dateReady) goTo('ex-when');
    else if (!serviceReady) goTo('ex-service');
    else if (!detailsReady) goTo('ex-you');
    else handleSubmit();
  };

  /* Submit to Supabase */
  const handleSubmit = async () => {
    if (!selectedService || !date || !time) return;
    setIsSubmitting(true);

    try {
      const confirmationNumber = 'FNA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const servicesLabel = selectedService.name;

      // Compile questions summary into notes
      const notesArray: string[] = [];
      if (info.hasPriorProduct === 'yes') {
        notesArray.push('[Tiene producto previo para retirar]');
      } else {
        notesArray.push('[Uñas naturales limpias / sin producto]');
      }
      notesArray.push(info.clientType === 'returning' ? '[Clienta recurrente]' : '[Primera cita]');
      if (info.notes.trim()) {
        notesArray.push(info.notes.trim());
      }
      const combinedNotes = notesArray.join(' - ');

      const { error } = await supabase.from('bookings').insert({
        service_name: servicesLabel,
        service_price: total,
        selected_services: [
          {
            id: selectedService.id,
            name: selectedService.name,
            price: selectedService.price,
            duration: selectedService.duration,
            category: selectedService.category,
          },
        ],
        services_total: servicePrice,
        service_duration_total: totalDuration,
        selected_add_ons: selectedAddOnsList.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          duration: a.duration || 0,
        })),
        add_ons_total: addOnsTotal,
        appointment_date: format(date, 'yyyy-MM-dd'),
        appointment_time: time,
        client_name: info.fullName,
        client_email: info.email,
        client_phone: info.phone,
        status: 'confirmed',
        notes: combinedNotes,
        confirmation_number: confirmationNumber,
      });

      if (error) {
        toast({ title: 'Error al reservar', description: error.message, variant: 'destructive' });
        return;
      }

      /* Trigger confirmation emails */
      try {
        const studioSettings = await getStudioSettings();
        const studioConfig = studioSettings
          ? {
              studioName: studioSettings.studio_name,
              studioPhone: studioSettings.studio_phone,
              studioEmail: studioSettings.studio_email,
              websiteUrl: studioSettings.website_url,
            }
          : {};

        const bookingPayload = {
          id: 'temp-id',
          service_name: servicesLabel,
          service_price: total,
          appointment_date: format(date, 'yyyy-MM-dd'),
          appointment_time: time,
          client_name: info.fullName,
          client_email: info.email,
          client_phone: info.phone,
          confirmation_number: confirmationNumber,
          notes: combinedNotes,
          selected_add_ons: selectedAddOnsList,
          add_ons_total: addOnsTotal,
        };

        await sendBookingEmail({
          type: 'confirmation',
          booking: bookingPayload,
          locationConfig: {
            includeInConfirmation: true,
            deliveryMethod: 'inline',
            fullAddress: '',
            displayAddress: 'Private Studio, Nashville TN',
            googleMapsLink: '',
            parkingInstructions: 'Free parking available on-site',
            accessInstructions: 'Please ring doorbell upon arrival',
          },
          studioConfig,
        });
      } catch (emailErr) {
        console.error('Email send failed:', emailErr);
      }

      setConfirmed({
        number: confirmationNumber,
        service: servicesLabel,
        addOns: selectedAddOnsList,
        duration: totalDuration,
        total,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewBooking = () => {
    setSelectedServiceId(null);
    setSelectedAddOnIds([]);
    setDate(undefined);
    setTime(undefined);
    setInfo(EMPTY_INFO);
    setConfirmed(null);
  };

  /* ── Confirmation View ── */
  if (confirmed) {
    return (
      <ConfirmationScreen
        confirmationNumber={confirmed.number}
        serviceName={confirmed.service}
        selectedAddOns={confirmed.addOns}
        date={date!}
        time={time!}
        duration={confirmed.duration}
        total={confirmed.total}
        info={info}
        depositAmount={config.depositAmount}
        onNewBooking={handleNewBooking}
      />
    );
  }

  /* ── Main Form View ── */
  return (
    <div className="mx-auto max-w-6xl pb-32 sm:pb-36 animate-fade-in">
      {/* Studio Header & Business Hours Banner */}
      <div className="mb-5 sm:mb-8 text-center max-w-2xl mx-auto px-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={13} />
          Francis Lozano Studio · Citas Privadas
        </span>
        <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground">
          Agenda Tu Cita
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
          Atención de <strong>Lunes a Sábado</strong> (8:30 AM – 1:30 PM y 3:00 PM – 7:00 PM). Domingos cerrado.
        </p>
      </div>

      {/* ─── MOBILE COMPACT STEPPER NAVIGATOR ─── */}
      <div className="lg:hidden sticky top-16 z-30 mb-6 bg-background/95 backdrop-blur-md pt-1 pb-2">
        <div className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-card border border-border shadow-sm text-xs">
          <button
            type="button"
            onClick={() => goTo('ex-when')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-colors font-medium text-center',
              dateReady ? 'text-accent bg-accent/10 font-semibold' : 'text-muted-foreground'
            )}
          >
            <span className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[10px]', dateReady ? 'bg-accent text-luxury-black font-bold' : 'bg-muted text-muted-foreground')}>
              {dateReady ? '✓' : '1'}
            </span>
            <span className="truncate">Fecha & Hora</span>
          </button>
          <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
          <button
            type="button"
            onClick={() => goTo('ex-service')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-colors font-medium text-center',
              serviceReady ? 'text-accent bg-accent/10 font-semibold' : 'text-muted-foreground'
            )}
          >
            <span className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[10px]', serviceReady ? 'bg-accent text-luxury-black font-bold' : 'bg-muted text-muted-foreground')}>
              {serviceReady ? '✓' : '2'}
            </span>
            <span className="truncate">Servicio</span>
          </button>
          <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
          <button
            type="button"
            onClick={() => goTo('ex-you')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-colors font-medium text-center',
              detailsReady ? 'text-accent bg-accent/10 font-semibold' : 'text-muted-foreground'
            )}
          >
            <span className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[10px]', detailsReady ? 'bg-accent text-luxury-black font-bold' : 'bg-muted text-muted-foreground')}>
              {detailsReady ? '✓' : '3'}
            </span>
            <span className="truncate">Tus Datos</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid: Left=Steps, Right=Desktop Sticky Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: The 3 Express Steps */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
          
          {/* ─── STEP 1: When ─── */}
          <section id="ex-when" className="scroll-mt-28">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold shadow-gold shrink-0">
                1
              </span>
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">¿Cuándo te gustaría venir?</h3>
                <p className="text-xs text-muted-foreground">Selecciona la fecha y el horario que mejor te convenga.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-elegant space-y-4">
              <DateStrip selected={date} onSelect={handleSelectDate} config={config} />

              <div className="pt-2 border-t border-border/60">
                <TimePills
                  date={date}
                  selected={time}
                  slots={availableSlots}
                  isLoading={isLoadingSlots}
                  onSelect={setTime}
                />
              </div>

              <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-accent shrink-0" />
                  {date
                    ? `${formatSpanishDate(date)} · Duración estimada: ${formatDuration(totalDuration)}`
                    : 'Lunes a Sábado · 8:30 AM a 7:00 PM · Pausa 1:30 PM–3:00 PM'}
                </span>
                <span className="text-accent font-medium text-[11px] sm:text-xs">Domingos cerrado</span>
              </div>
            </div>
          </section>

          {/* ─── STEP 2: Service & Add-Ons ─── */}
          <section id="ex-service" className="scroll-mt-28">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold shadow-gold shrink-0">
                2
              </span>
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">¿Qué servicio deseas?</h3>
                <p className="text-xs text-muted-foreground">Elige tu servicio principal y agrega diseños o adicionales.</p>
              </div>
            </div>

            {/* Mobile Category Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 touch-pan-x mb-3">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 shrink-0',
                    selectedCategory === cat.key
                      ? 'bg-accent text-luxury-black border-accent font-semibold shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:border-accent/40'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Services Menu */}
            <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 shadow-elegant overflow-hidden">
              {filteredServices.map((service) => {
                const selected = service.id === selectedServiceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId((prev) => (prev === service.id ? null : service.id))}
                    className={cn(
                      'w-full p-3.5 sm:p-5 text-left transition-all duration-200 flex flex-col gap-2 group active:bg-accent/15',
                      selected
                        ? 'bg-accent/10 border-l-4 border-l-accent'
                        : 'hover:bg-accent/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full border transition-all',
                            selected
                              ? 'border-accent bg-accent text-luxury-black'
                              : 'border-muted-foreground/40 text-transparent group-hover:border-accent'
                          )}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className={cn('text-sm sm:text-base font-semibold leading-snug block break-words', selected ? 'text-accent' : 'text-card-foreground')}>
                            {service.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={cn('font-heading font-bold text-base sm:text-lg block', selected ? 'text-accent' : 'text-foreground')}>
                          {service.name.toLowerCase().includes('desde') ? '' : 'desde '}${service.price}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal border-border mt-0.5 inline-block">
                          ⏱ {formatDuration(service.duration)}
                        </Badge>
                      </div>
                    </div>

                    {service.description && (
                      <p className="text-xs text-muted-foreground pl-7 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pl-7 text-[11px] text-muted-foreground">
                      <span className="text-accent/80 font-medium">{categoryLabel(service.category)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ─── ADD-ONS & DISEÑOS ADICIONALES ─── */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Add-Ons, Diseños y Retiro Opcionales
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedAddOnIds.length} seleccionados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {addOns.map((addon) => {
                  const isChecked = selectedAddOnIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon.id)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-2.5 active:scale-[0.99]',
                        isChecked
                          ? 'border-accent bg-accent/10 shadow-sm'
                          : 'border-border/80 bg-card hover:border-accent/60 hover:bg-accent/5'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 mt-0.5 items-center justify-center rounded border transition-all',
                          isChecked ? 'border-accent bg-accent text-luxury-black' : 'border-muted-foreground/40 text-transparent'
                        )}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className={cn('text-xs font-semibold break-words leading-tight', isChecked ? 'text-accent' : 'text-card-foreground')}>
                            {addon.name}
                          </span>
                          <span className="text-xs font-bold text-accent shrink-0 ml-1">+${addon.price}</span>
                        </div>
                        {addon.description && (
                          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                            {addon.description}
                          </p>
                        )}
                        {addon.duration && addon.duration > 0 && (
                          <span className="text-[10px] text-muted-foreground/80 block pt-0.5">
                            +{formatDuration(addon.duration)} en agenda
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ─── STEP 3: Who's Booking ─── */}
          <section id="ex-you" className="scroll-mt-28">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold shadow-gold shrink-0">
                3
              </span>
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">Información del Cliente</h3>
                <p className="text-xs text-muted-foreground">Datos para confirmar tu cita y preparar tu atención.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-elegant space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="ex-full-name" className="text-xs font-medium text-card-foreground flex items-center gap-1.5">
                  <User size={12} className="text-accent" />
                  Nombre Completo <span className="text-accent">*</span>
                </Label>
                <Input
                  id="ex-full-name"
                  value={info.fullName}
                  onChange={(e) => setInfoField('fullName', e.target.value)}
                  placeholder="Tu nombre y apellido"
                  autoComplete="name"
                  className="bg-background/90 text-base sm:text-sm h-11"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ex-phone" className="text-xs font-medium text-card-foreground flex items-center gap-1.5">
                    <Phone size={12} className="text-accent" />
                    Teléfono / WhatsApp <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="ex-phone"
                    type="tel"
                    inputMode="tel"
                    value={info.phone}
                    onChange={(e) => setInfoField('phone', e.target.value)}
                    placeholder="+1 737-378-5755"
                    autoComplete="tel"
                    className="bg-background/90 text-base sm:text-sm h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ex-email" className="text-xs font-medium text-card-foreground flex items-center gap-1.5">
                    <Mail size={12} className="text-accent" />
                    Correo Electrónico <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="ex-email"
                    type="email"
                    inputMode="email"
                    value={info.email}
                    onChange={(e) => setInfoField('email', e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className="bg-background/90 text-base sm:text-sm h-11"
                  />
                </div>
              </div>

              {/* Studio Questions */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider block">
                  Preguntas de Preparación para la Cita
                </span>

                {/* Prior product question */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-card-foreground">
                    ¿Actualmente tienes algún producto en tus uñas para retirar?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInfoField('hasPriorProduct', 'no')}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-medium text-center transition-all min-h-[44px] flex items-center justify-center gap-1.5',
                        info.hasPriorProduct === 'no'
                          ? 'border-accent bg-accent/15 text-accent font-semibold shadow-sm'
                          : 'border-border bg-background/60 text-muted-foreground hover:border-accent/40'
                      )}
                    >
                      {info.hasPriorProduct === 'no' && <Check size={14} className="text-accent shrink-0" />}
                      <span>Uñas naturales sin producto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInfoField('hasPriorProduct', 'yes');
                        const removal = addOns.find((a) => a.id.includes('removal'));
                        if (removal && !selectedAddOnIds.includes(removal.id)) {
                          toggleAddOn(removal.id);
                        }
                      }}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-medium text-center transition-all min-h-[44px] flex items-center justify-center gap-1.5',
                        info.hasPriorProduct === 'yes'
                          ? 'border-accent bg-accent/15 text-accent font-semibold shadow-sm'
                          : 'border-border bg-background/60 text-muted-foreground hover:border-accent/40'
                      )}
                    >
                      {info.hasPriorProduct === 'yes' && <Check size={14} className="text-accent shrink-0" />}
                      <span>Tengo producto para retirar (+1h)</span>
                    </button>
                  </div>
                </div>

                {/* Returning or new */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-card-foreground">
                    ¿Es tu primera cita o eres clienta recurrente?
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInfoField('clientType', 'new')}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-medium text-center transition-all min-h-[44px] flex items-center justify-center gap-1.5',
                        info.clientType === 'new'
                          ? 'border-accent bg-accent/15 text-accent font-semibold shadow-sm'
                          : 'border-border bg-background/60 text-muted-foreground hover:border-accent/40'
                      )}
                    >
                      {info.clientType === 'new' && <Check size={14} className="text-accent shrink-0" />}
                      <span>Primera Cita</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInfoField('clientType', 'returning')}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-medium text-center transition-all min-h-[44px] flex items-center justify-center gap-1.5',
                        info.clientType === 'returning'
                          ? 'border-accent bg-accent/15 text-accent font-semibold shadow-sm'
                          : 'border-border bg-background/60 text-muted-foreground hover:border-accent/40'
                      )}
                    >
                      {info.clientType === 'returning' && <Check size={14} className="text-accent shrink-0" />}
                      <span>Clienta Recurrente</span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="ex-notes" className="text-xs font-medium text-card-foreground">
                    Notas adicionales / Ideas de diseño{' '}
                    <span className="text-muted-foreground text-[11px] font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="ex-notes"
                    value={info.notes}
                    onChange={(e) => setInfoField('notes', e.target.value)}
                    placeholder="Alergias, fotos de referencia o comentarios sobre tu cita…"
                    className="bg-background/90 min-h-[75px] resize-none text-base sm:text-xs"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ─── Right Column: DESKTOP STICKY RESERVATION SUMMARY CARD ─── */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="rounded-2xl border-2 border-accent/40 bg-card p-6 shadow-xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                Resumen de Reserva
              </span>
              <Badge variant="outline" className="text-xs border-accent text-accent font-semibold">
                Francis Lozano
              </Badge>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">1. Fecha & Hora</span>
                {dateReady ? (
                  <span className="font-semibold text-accent flex items-center gap-1">
                    <Check size={12} strokeWidth={3} />
                    {formatSpanishDate(date!)} · {time}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 italic">Pendiente</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">2. Servicio</span>
                {serviceReady ? (
                  <span className="font-semibold text-accent truncate max-w-[170px] flex items-center gap-1">
                    <Check size={12} strokeWidth={3} />
                    {selectedService?.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 italic">Pendiente</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">3. Datos de Contacto</span>
                {detailsReady ? (
                  <span className="font-semibold text-emerald-500 flex items-center gap-1">
                    <Check size={12} strokeWidth={3} /> Completo
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 italic">Pendiente</span>
                )}
              </div>
            </div>

            {/* Selected Add-Ons */}
            {selectedAddOnsList.length > 0 && (
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-1.5 text-xs">
                <span className="font-semibold text-accent block">Add-Ons ({selectedAddOnsList.length}):</span>
                {selectedAddOnsList.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate">• {addon.name}</span>
                    <span className="font-medium text-foreground ml-2">+${addon.price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Time & Total Price */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Duración Estimada:</span>
                <span className="font-medium text-foreground">
                  ⏱ {formatDuration(totalDuration)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-card-foreground">Total Estimado</span>
                <span className="font-heading text-3xl font-bold text-accent">
                  ${total > 0 ? total : '0'}
                </span>
              </div>
            </div>

            {/* Deposit Notice */}
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-accent">
                <ShieldCheck size={14} />
                <span>Depósito Requerido: ${config.depositAmount}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Para asegurar el turno se solicita un depósito de ${config.depositAmount}. El resto se abona al finalizar el servicio.
              </p>
            </div>

            {/* Big Reserve Button for Laptop / Desktop */}
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              className={cn(
                'w-full py-6 text-base font-bold shadow-lg transition-all duration-200',
                readyToConfirm
                  ? 'bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black shadow-gold hover:scale-[1.01]'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-luxury-black mr-2" />
                  Registrando Cita…
                </>
              ) : readyToConfirm ? (
                <>
                  Confirmar y Reservar · ${total}
                </>
              ) : (
                <>
                  {actionLabel}
                  <ArrowDown size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE EXPANDABLE DETAIL DRAWER ─── */}
      {showMobileDetails && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in" onClick={() => setShowMobileDetails(false)}>
          <div 
            className="bg-card border-t-2 border-accent rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                Detalle de tu Cita
              </span>
              <button 
                type="button" 
                onClick={() => setShowMobileDetails(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Fecha & Horario</span>
                <p className="font-semibold text-foreground text-sm">
                  {dateReady ? `${formatSpanishDate(date!, true)} · ${time}` : 'No seleccionado'}
                </p>
                <p className="text-[11px] text-accent">Duración estimada: {formatDuration(totalDuration)}</p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Servicio Principal</span>
                <p className="font-semibold text-foreground text-sm">
                  {selectedService ? selectedService.name : 'No seleccionado'}
                </p>
                {selectedService && (
                  <p className="text-accent font-medium">${selectedService.price}</p>
                )}
              </div>

              {selectedAddOnsList.length > 0 && (
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-accent font-semibold block">
                    Add-Ons Seleccionados ({selectedAddOnsList.length})
                  </span>
                  {selectedAddOnsList.map((addon) => (
                    <div key={addon.id} className="flex justify-between text-muted-foreground">
                      <span>• {addon.name}</span>
                      <span className="font-medium text-foreground ml-2">+${addon.price}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-border">
                <span className="text-sm font-semibold text-card-foreground">Total Estimado</span>
                <span className="font-heading text-2xl font-bold text-accent">${total}</span>
              </div>

              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-accent">
                  <ShieldCheck size={14} />
                  <span>Depósito de Reserva: ${config.depositAmount}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Para asegurar tu turno se solicita un depósito de ${config.depositAmount}. El resto se abona al finalizar el servicio.
                </p>
              </div>
            </div>

            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              className={cn(
                'w-full py-3.5 text-sm font-bold shadow-lg transition-all duration-200',
                readyToConfirm
                  ? 'bg-gradient-gold text-luxury-black shadow-gold'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {readyToConfirm ? `Confirmar Cita · $${total}` : actionLabel}
            </Button>
          </div>
        </div>
      )}

      {/* ─── MOBILE STICKY ACTION BAR ─── */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div 
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => setShowMobileDetails((prev) => !prev)}
          >
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
              <span className="truncate">
                {serviceReady && dateReady
                  ? `${selectedService?.name} · ${date!.getDate()} ${SPANISH_MONTHS[date!.getMonth()]}`
                  : serviceReady
                  ? selectedService?.name
                  : dateReady
                  ? `${date!.getDate()} ${SPANISH_MONTHS[date!.getMonth()]} · ${time}`
                  : 'Reserva Express'}
              </span>
              <ChevronUp size={13} className="shrink-0 text-accent" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-heading text-lg font-bold text-accent">
                {total > 0 ? `$${total}` : 'Desde $60'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ⏱ {formatDuration(totalDuration)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleAction}
            disabled={isSubmitting}
            className={cn(
              'shrink-0 font-semibold px-4 py-2.5 text-xs sm:text-sm transition-all duration-200 shadow-md h-11',
              readyToConfirm
                ? 'bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black shadow-gold'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-luxury-black mr-2" />
                Reservando…
              </>
            ) : (
              <>
                {readyToConfirm ? `Reservar · $${total}` : actionLabel}
                {!readyToConfirm && <ArrowDown size={14} className="ml-1.5" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
