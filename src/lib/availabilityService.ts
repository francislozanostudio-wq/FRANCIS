import { format, parse, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import { supabase } from './supabase';

export interface TimeBlock {
  start: string; // "08:30"
  end: string;   // "13:30"
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dayName: string;
  isOpen: boolean;
  blocks: TimeBlock[];
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface BlockedTimeSlot {
  id: string;
  type: 'specific_date' | 'recurring_day' | 'every_day';
  date?: string; // YYYY-MM-DD
  dayOfWeek?: number; // 0..6
  time: string; // e.g. "10:00 AM" or "10:00"
  reason?: string;
}

export interface AvailabilityConfig {
  depositAmount: number;
  slotIntervalMinutes: number;
  lunchBreak: {
    start: string; // "13:30"
    end: string;   // "15:00"
  };
  weeklySchedule: DaySchedule[];
  blockedDates: BlockedDate[];
  blockedTimeSlots: BlockedTimeSlot[];
}

export const DEFAULT_AVAILABILITY_CONFIG: AvailabilityConfig = {
  depositAmount: 20,
  slotIntervalMinutes: 30,
  lunchBreak: {
    start: '13:30',
    end: '15:00',
  },
  weeklySchedule: [
    { dayOfWeek: 0, dayName: 'Domingo', isOpen: false, blocks: [] },
    {
      dayOfWeek: 1,
      dayName: 'Lunes',
      isOpen: true,
      blocks: [
        { start: '08:30', end: '13:30' },
        { start: '15:00', end: '19:00' },
      ],
    },
    {
      dayOfWeek: 2,
      dayName: 'Martes',
      isOpen: true,
      blocks: [
        { start: '08:30', end: '13:30' },
        { start: '15:00', end: '19:00' },
      ],
    },
    {
      dayOfWeek: 3,
      dayName: 'Miércoles',
      isOpen: true,
      blocks: [
        { start: '08:30', end: '13:30' },
        { start: '15:00', end: '19:00' },
      ],
    },
    {
      dayOfWeek: 4,
      dayName: 'Jueves',
      isOpen: true,
      blocks: [
        { start: '08:30', end: '13:30' },
        { start: '15:00', end: '19:00' },
      ],
    },
    {
      dayOfWeek: 5,
      dayName: 'Viernes',
      isOpen: true,
      blocks: [
        { start: '08:30', end: '13:30' },
        { start: '15:00', end: '19:00' },
      ],
    },
    {
      dayOfWeek: 6,
      dayName: 'Sábado',
      isOpen: true,
      blocks: [
        { start: '08:30', end: '13:30' },
        { start: '15:00', end: '19:00' },
      ],
    },
  ],
  blockedDates: [],
  blockedTimeSlots: [],
};

const LOCAL_STORAGE_KEY = 'francis_availability_config';

/**
 * Fetch availability config from Supabase or fallback to localStorage / default
 */
export async function getAvailabilityConfig(): Promise<AvailabilityConfig> {
  try {
    const { data, error } = await supabase
      .from('studio_settings')
      .select('availability_config')
      .limit(1)
      .maybeSingle();

    if (!error && data && data.availability_config) {
      const merged: AvailabilityConfig = {
        ...DEFAULT_AVAILABILITY_CONFIG,
        ...(data.availability_config as Partial<AvailabilityConfig>),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Could not load availability config from Supabase, checking local cache:', err);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return {
        ...DEFAULT_AVAILABILITY_CONFIG,
        ...JSON.parse(saved),
      };
    }
  } catch {
    // ignore
  }

  return DEFAULT_AVAILABILITY_CONFIG;
}

/**
 * Save availability config to Supabase and localStorage
 */
export async function saveAvailabilityConfig(config: AvailabilityConfig): Promise<boolean> {
  // Save locally first
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));

  try {
    // Attempt saving to studio_settings
    const { data: existing } = await supabase
      .from('studio_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('studio_settings')
        .update({
          availability_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (!error) return true;
    }
  } catch (err) {
    console.warn('Could not persist availability config to Supabase:', err);
  }

  return true;
}

export interface ComputedSlot {
  time: string; // "8:30 AM"
  isBooked: boolean;
  disabledReason?: string;
}

// Convert "08:30" to "8:30 AM"
export function formatTime24to12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  const mPadded = m < 10 ? `0${m}` : `${m}`;
  return `${h}:${mPadded} ${ampm}`;
}

// Convert "8:30 AM" to minutes since midnight
export function timeStringToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Convert minutes to "8:30 AM"
export function minutesToTimeString(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const mPadded = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mPadded} ${ampm}`;
}

export interface ExistingBookingSlot {
  appointment_time: string;
  service_duration_total?: number;
  service_price?: number;
  status?: string;
}

/**
 * Generate available time slots for a given date taking into account:
 * 1. Day of week schedule (Mon-Sat, Sunday closed)
 * 2. Blocked dates (holidays, personal days off)
 * 3. Working blocks (8:30 AM - 1:30 PM & 3:00 PM - 7:00 PM)
 * 4. Lunch break (1:30 PM - 3:00 PM) -> slot + duration CANNOT overlap with 1:30 PM - 3:00 PM
 * 5. Closing time (7:00 PM) -> slot + duration CANNOT extend past 7:00 PM
 * 6. Admin custom blocked time slots (by date, day of week, or every day)
 * 7. Real Supabase confirmed bookings on that date
 */
export function calculateSlotsForDate(
  date: Date,
  durationMinutes: number = 120,
  config: AvailabilityConfig = DEFAULT_AVAILABILITY_CONFIG,
  existingBookings: ExistingBookingSlot[] = []
): ComputedSlot[] {
  const dayOfWeek = date.getDay(); // 0=Sunday
  const dateStr = format(date, 'yyyy-MM-dd');

  // Check if whole day is closed
  const dayConfig = config.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
  if (!dayConfig || !dayConfig.isOpen) {
    return [];
  }

  // Check if specific date is blocked
  const isDateBlocked = config.blockedDates.some((b) => b.date === dateStr);
  if (isDateBlocked) {
    return [];
  }

  // Parse lunch pause in minutes
  const lunchStartMin = timeStringToMinutes(config.lunchBreak.start); // e.g. 13:30 = 810
  const lunchEndMin = timeStringToMinutes(config.lunchBreak.end);     // e.g. 15:00 = 900

  // Existing booked ranges in minutes [startMin, endMin]
  const bookedRanges: { start: number; end: number }[] = existingBookings
    .filter((b) => b.status !== 'cancelled')
    .map((b) => {
      const start = timeStringToMinutes(b.appointment_time);
      const dur = b.service_duration_total && b.service_duration_total > 0 ? b.service_duration_total : 120;
      return { start, end: start + dur };
    });

  const slots: ComputedSlot[] = [];
  const interval = config.slotIntervalMinutes || 30;

  // For each working block in the day (e.g. 08:30-13:30, 15:00-19:00)
  for (const block of dayConfig.blocks) {
    const blockStartMin = timeStringToMinutes(block.start);
    const blockEndMin = timeStringToMinutes(block.end);

    for (let cur = blockStartMin; cur < blockEndMin; cur += interval) {
      const slotEndMin = cur + durationMinutes;

      // Rule: Service must fit inside the working block!
      // If cur is in Block 1 (morning), slotEndMin must not exceed blockEndMin (1:30 PM / 810 min).
      // Also cannot overlap with lunch break!
      if (cur < lunchStartMin && slotEndMin > blockEndMin) {
        // Doesn't fit in morning block before lunch
        continue;
      }

      // If cur is in Block 2 (afternoon), slotEndMin must not exceed 7:00 PM (1140 min).
      if (cur >= lunchEndMin && slotEndMin > blockEndMin) {
        // Doesn't fit before end of working day
        continue;
      }

      // If slot start falls inside lunch break
      if (cur >= lunchStartMin && cur < lunchEndMin) {
        continue;
      }

      const time12 = minutesToTimeString(cur);

      // Check if blocked by admin custom rule
      const isBlockedByAdmin = config.blockedTimeSlots.some((bt) => {
        const timeMatch = timeStringToMinutes(bt.time) === cur;
        if (!timeMatch) return false;

        if (bt.type === 'every_day') return true;
        if (bt.type === 'recurring_day' && bt.dayOfWeek === dayOfWeek) return true;
        if (bt.type === 'specific_date' && bt.date === dateStr) return true;
        return false;
      });

      if (isBlockedByAdmin) {
        slots.push({
          time: time12,
          isBooked: true,
          disabledReason: 'Horario no disponible',
        });
        continue;
      }

      // Check overlap with existing confirmed bookings
      const overlapsBooking = bookedRanges.some((range) => {
        // Overlap occurs if (cur < range.end && slotEndMin > range.start)
        return cur < range.end && slotEndMin > range.start;
      });

      if (overlapsBooking) {
        slots.push({
          time: time12,
          isBooked: true,
          disabledReason: 'Reservado',
        });
        continue;
      }

      // Available!
      slots.push({
        time: time12,
        isBooked: false,
      });
    }
  }

  return slots;
}
