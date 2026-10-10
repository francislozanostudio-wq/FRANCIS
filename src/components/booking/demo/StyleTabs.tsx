import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, LayoutGrid, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/translations';
import {
  categoryLabel,
  DateStrip,
  DemoCheck,
  DemoConfirmation,
  DemoLoader,
  DetailsFields,
  formatDuration,
  SelectionSummary,
  TimePills,
  type DemoBooking,
} from './shared';

const TABS = [
  { label: 'Service', icon: LayoutGrid },
  { label: 'When', icon: CalendarDays },
  { label: 'Details', icon: User },
];

interface StyleTabsProps {
  booking: DemoBooking;
}

export function StyleTabs({ booking }: StyleTabsProps) {
  const [tab, setTab] = useState(0);
  const { translateByText } = useTranslations();

  if (booking.confirmation) {
    return <DemoConfirmation booking={booking} styleName="Tabbed" />;
  }

  const reachable = booking.servicesReady ? (booking.dateReady ? 2 : 1) : 0;
  const canOpen = (index: number) => index <= reachable;
  const tabDone = [booking.servicesReady, booking.dateReady, booking.detailsReady];

  const nextDisabled = tab === 0 ? !booking.servicesReady : tab === 1 ? !booking.dateReady : false;

  const goNext = () => {
    if (tab < 2) setTab(tab + 1);
    else booking.confirm();
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {/* Segmented control */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {TABS.map((item, index) => {
          const active = tab === index;
          return (
            <button
              key={item.label}
              type="button"
              disabled={!canOpen(index)}
              onClick={() => canOpen(index) && setTab(index)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-200',
                active && 'bg-card text-card-foreground shadow-elegant',
                !active && 'text-muted-foreground hover:text-foreground',
                !canOpen(index) && 'opacity-40 cursor-not-allowed'
              )}
            >
              <item.icon size={16} className={cn('hidden sm:block', active ? 'text-accent' : '')} />
              <span>{item.label}</span>
              {tabDone[index] && !active && <Check size={14} className="text-accent" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* Selection chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs',
            booking.servicesReady ? 'border-accent/50 bg-accent/10 text-card-foreground' : 'border-border text-muted-foreground'
          )}
        >
          {booking.servicesReady
            ? `${booking.selectedServices.length} service · $${booking.total}`
            : 'No service yet'}
        </span>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs',
            booking.date ? 'border-accent/50 bg-accent/10 text-card-foreground' : 'border-border text-muted-foreground'
          )}
        >
          {booking.date ? format(booking.date, 'EEE, MMM d') : 'No date yet'}
        </span>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs',
            booking.time ? 'border-accent/50 bg-accent/10 text-card-foreground' : 'border-border text-muted-foreground'
          )}
        >
          {booking.time ?? 'No time yet'}
        </span>
      </div>

      {/* Panels */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-elegant min-h-[360px]">
        {tab === 0 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Select your service</h2>
            <p className="text-sm text-muted-foreground mb-4">Tap to add — pick as many as you like.</p>

            {booking.isLoading ? (
              <DemoLoader />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {booking.services.map((service) => {
                  const selected = booking.isSelected(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => booking.toggleService(service.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200',
                        selected
                          ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                          : 'border-border hover:border-accent/50'
                      )}
                    >
                      <DemoCheck checked={selected} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-card-foreground">
                          {translateByText(service.name)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDuration(service.duration)} · {categoryLabel(service.category)}
                        </span>
                      </span>
                      <span className="font-semibold text-accent">${service.price}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-1">When works for you?</h2>
            <p className="text-sm text-muted-foreground mb-4">Monday–Saturday, 7 AM–5 PM.</p>

            <DateStrip selected={booking.date} onSelect={booking.selectDate} />
            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-card-foreground">
                {booking.date ? `Available on ${format(booking.date, 'EEEE, MMMM d')}` : 'Select a date to see times'}
              </p>
              <TimePills date={booking.date} selected={booking.time} onSelect={booking.selectTime} columns={3} />
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Your details</h2>
            <p className="text-sm text-muted-foreground mb-4">Last step — then you're booked.</p>

            <div className="grid sm:grid-cols-2 gap-6">
              <DetailsFields info={booking.info} onChange={booking.setInfoField} showNotes={false} />
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="mb-3 text-sm font-semibold text-card-foreground">Summary</p>
                <SelectionSummary booking={booking} compact />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="sticky bottom-4 z-10 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur">
        <Button
          type="button"
          variant="outline"
          disabled={tab === 0}
          onClick={() => setTab((current) => Math.max(0, current - 1))}
          className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <span className="text-xs text-muted-foreground">
          {tab === 0 && 'Step 1 of 3'}
          {tab === 1 && 'Step 2 of 3'}
          {tab === 2 && 'Step 3 of 3'}
        </span>

        <Button
          type="button"
          disabled={nextDisabled}
          onClick={goNext}
          className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
        >
          {tab === 2 ? 'Confirm booking' : 'Continue'}
          {tab === 2 ? <Check size={16} /> : <ArrowRight size={16} />}
        </Button>
      </div>
    </div>
  );
}
