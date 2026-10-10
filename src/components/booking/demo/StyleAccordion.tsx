import { useState } from 'react';
import { Check, ChevronDown, Pencil } from 'lucide-react';
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

interface Panel {
  number: number;
  title: string;
}

const PANELS: Panel[] = [
  { number: 1, title: 'Choose your service' },
  { number: 2, title: 'Pick date & time' },
  { number: 3, title: 'Your details' },
  { number: 4, title: 'Review & confirm' },
];

interface StyleAccordionProps {
  booking: DemoBooking;
}

export function StyleAccordion({ booking }: StyleAccordionProps) {
  const [open, setOpen] = useState(1);
  const { translateByText } = useTranslations();

  if (booking.confirmation) {
    return <DemoConfirmation booking={booking} styleName="Accordion" />;
  }

  const canOpen = (number: number): boolean => {
    if (number === 1) return true;
    if (number === 2) return booking.servicesReady;
    if (number === 3) return booking.servicesReady && booking.dateReady;
    return booking.readyToConfirm;
  };

  const isDone = (number: number): boolean => {
    if (number === 1) return booking.servicesReady;
    if (number === 2) return booking.dateReady;
    if (number === 3) return booking.detailsReady;
    return false;
  };

  const summaryFor = (number: number): string => {
    if (number === 1)
      return booking.servicesReady
        ? `${booking.selectedServices.length} service${booking.selectedServices.length !== 1 ? 's' : ''} · $${booking.total}`
        : 'Select at least one';
    if (number === 2)
      return booking.dateReady
        ? `${format(booking.date!, 'EEE, MMM d')} · ${booking.time}`
        : 'Choose date & time';
    if (number === 3) return booking.detailsReady ? booking.info.fullName : 'Add your contact info';
    return '';
  };

  const advance = (from: number) => {
    if (isDone(from)) setOpen(from + 1);
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <p className="mb-4 text-sm text-muted-foreground">
        One section at a time — each step unlocks the next.
      </p>

      <div className="space-y-3">
        {PANELS.map((panel) => {
          const isOpen = open === panel.number;
          const done = isDone(panel.number);
          const allowed = canOpen(panel.number);

          return (
            <div
              key={panel.number}
              className={cn(
                'overflow-hidden rounded-2xl border bg-card transition-all duration-300',
                isOpen ? 'border-accent/60 shadow-elegant' : 'border-border',
                !allowed && 'opacity-60'
              )}
            >
              <button
                type="button"
                disabled={!allowed}
                onClick={() => setOpen(isOpen ? 0 : panel.number)}
                className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all',
                    done && !isOpen
                      ? 'bg-accent text-luxury-black'
                      : isOpen
                      ? 'bg-gradient-gold text-luxury-black'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {done && !isOpen ? <Check size={15} strokeWidth={3} /> : panel.number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-heading font-semibold text-card-foreground">{panel.title}</span>
                  {panel.number < 4 && (
                    <span className={cn('block truncate text-sm', done ? 'text-accent' : 'text-muted-foreground')}>
                      {summaryFor(panel.number)}
                    </span>
                  )}
                </span>

                {panel.number < 4 && done && !isOpen && (
                  <Pencil size={15} className="shrink-0 text-muted-foreground" />
                )}
                <ChevronDown
                  size={18}
                  className={cn('shrink-0 text-muted-foreground transition-transform duration-300', isOpen && 'rotate-180 text-accent')}
                />
              </button>

              {isOpen && (
                <div className="border-t border-border p-4 animate-fade-in sm:p-5">
                  {panel.number === 1 && (
                    <>
                      {booking.isLoading ? (
                        <DemoLoader />
                      ) : (
                        <div className="space-y-2.5">
                          {booking.services.map((service) => {
                            const selected = booking.isSelected(service.id);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => booking.toggleService(service.id)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200',
                                  selected
                                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                                    : 'border-border hover:border-accent/50'
                                )}
                              >
                                <DemoCheck checked={selected} className="h-5 w-5" />
                                <span className="min-w-0 flex-1 truncate font-medium text-card-foreground">
                                  {translateByText(service.name)}
                                </span>
                                <span className="text-xs text-muted-foreground">{formatDuration(service.duration)}</span>
                                <span className="font-semibold text-accent">${service.price}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <Button
                          disabled={!booking.servicesReady}
                          onClick={() => advance(1)}
                          className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
                        >
                          {booking.servicesReady
                            ? `Continue · $${booking.total}`
                            : 'Select a service to continue'}
                        </Button>
                      </div>
                    </>
                  )}

                  {panel.number === 2 && (
                    <>
                      <DateStrip selected={booking.date} onSelect={booking.selectDate} />
                      <div className="mt-4">
                        <p className="mb-3 text-sm font-medium text-card-foreground">
                          {booking.date
                            ? `Available on ${format(booking.date, 'EEEE, MMMM d')}`
                            : 'Select a date to see times'}
                        </p>
                        <TimePills date={booking.date} selected={booking.time} onSelect={booking.selectTime} columns={3} />
                      </div>
                      <div className="mt-4 flex justify-between gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setOpen(1)}
                          className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent"
                        >
                          Back
                        </Button>
                        <Button
                          disabled={!booking.dateReady}
                          onClick={() => advance(2)}
                          className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
                        >
                          Continue
                        </Button>
                      </div>
                    </>
                  )}

                  {panel.number === 3 && (
                    <>
                      <DetailsFields info={booking.info} onChange={booking.setInfoField} showNotes={false} />
                      <div className="mt-4 flex justify-between gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setOpen(2)}
                          className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent"
                        >
                          Back
                        </Button>
                        <Button
                          disabled={!booking.detailsReady}
                          onClick={() => advance(3)}
                          className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
                        >
                          Review booking
                        </Button>
                      </div>
                    </>
                  )}

                  {panel.number === 4 && (
                    <>
                      <div className="rounded-xl border border-border bg-background/60 p-4">
                        <SelectionSummary booking={booking} />
                        <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                          <p className="font-medium text-card-foreground">{booking.info.fullName}</p>
                          <p>{booking.info.email}</p>
                          <p>{booking.info.phone}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setOpen(3)}
                          className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={booking.confirm}
                          className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
                        >
                          <Check size={16} />
                          Confirm booking
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category hint under the list, keeps context on mobile */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Categories:{' '}
        {Array.from(new Set(booking.services.map((service) => service.category)))
          .map(categoryLabel)
          .join(' · ')}
      </p>
    </div>
  );
}
