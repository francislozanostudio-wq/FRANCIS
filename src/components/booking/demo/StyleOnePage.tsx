import { useMemo, useState } from 'react';
import { ArrowDown, Clock } from 'lucide-react';
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

interface StyleOnePageProps {
  booking: DemoBooking;
}

export function StyleOnePage({ booking }: StyleOnePageProps) {
  const [category, setCategory] = useState<string>('all');
  const { translateByText } = useTranslations();

  const categories = useMemo(() => {
    const seen: string[] = [];
    booking.services.forEach((service) => {
      if (!seen.includes(service.category)) seen.push(service.category);
    });
    return seen;
  }, [booking.services]);

  const visibleServices = useMemo(
    () =>
      category === 'all'
        ? booking.services
        : booking.services.filter((service) => service.category === category),
    [booking.services, category]
  );

  if (booking.confirmation) {
    return <DemoConfirmation booking={booking} styleName="One Page" />;
  }

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const actionLabel = !booking.servicesReady
    ? 'Choose a service'
    : !booking.dateReady
    ? 'Pick date & time'
    : !booking.detailsReady
    ? 'Add your details'
    : `Confirm · $${booking.total}`;

  const handleAction = () => {
    if (!booking.servicesReady) goTo('op-services');
    else if (!booking.dateReady) goTo('op-datetime');
    else if (!booking.detailsReady) goTo('op-details');
    else booking.confirm();
  };

  const actionButton = (
    <Button
      type="button"
      onClick={handleAction}
      className={cn(
        'w-full sm:w-auto font-semibold',
        booking.readyToConfirm
          ? 'bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      )}
    >
      {actionLabel}
      {!booking.readyToConfirm && <ArrowDown size={16} />}
    </Button>
  );

  const summaryCard = (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <h3 className="font-heading text-lg font-semibold text-card-foreground mb-4">Your booking</h3>
      <SelectionSummary booking={booking} />
      <div className="mt-5">{actionButton}</div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Demo mode — nothing is saved.</p>
    </div>
  );

  return (
    <div className="pb-28 lg:pb-0 animate-fade-in">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-12 min-w-0">
          {/* Section 1 — services */}
          <section id="op-services" className="scroll-mt-36">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold">
                1
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground">Choose your service</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 ml-10">Select one or more services.</p>

            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
              {[{ value: 'all', label: 'All' }, ...categories.map((c) => ({ value: c, label: categoryLabel(c) }))].map(
                (chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setCategory(chip.value)}
                    className={cn(
                      'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200',
                      category === chip.value
                        ? 'border-accent bg-gradient-gold text-luxury-black'
                        : 'border-border text-muted-foreground hover:border-accent/60 hover:text-accent'
                    )}
                  >
                    {chip.label}
                  </button>
                )
              )}
            </div>

            {booking.isLoading ? (
              <DemoLoader />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleServices.map((service) => {
                  const selected = booking.isSelected(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => booking.toggleService(service.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all duration-200',
                        selected
                          ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                          : 'border-border bg-card hover:border-accent/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-heading font-semibold text-card-foreground">
                          {translateByText(service.name)}
                        </span>
                        <span className="font-semibold text-accent">${service.price}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {translateByText(service.description)}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={13} />
                          {formatDuration(service.duration)} · {categoryLabel(service.category)}
                        </span>
                        <DemoCheck checked={selected} className="h-5 w-5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2 — date & time */}
          <section id="op-datetime" className="scroll-mt-36">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold">
                2
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground">Pick date & time</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 ml-10">Closed Sundays · lunch break 1–2 PM.</p>

            <DateStrip selected={booking.date} onSelect={booking.selectDate} />
            <div className="mt-4">
              <TimePills date={booking.date} selected={booking.time} onSelect={booking.selectTime} columns={3} />
            </div>
          </section>

          {/* Section 3 — details */}
          <section id="op-details" className="scroll-mt-36">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold">
                3
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground">Your details</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 ml-10">Name, email and phone — that's it.</p>

            <div className="rounded-2xl border border-border bg-card p-5 max-w-2xl">
              <DetailsFields info={booking.info} onChange={booking.setInfoField} />
            </div>

            <div className="mt-6 flex justify-center lg:justify-start">{actionButton}</div>
          </section>
        </div>

        {/* Live summary */}
        <aside className="hidden lg:block sticky top-36">{summaryCard}</aside>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {booking.servicesReady
                ? `${booking.selectedServices.length} service · ${formatDuration(booking.duration)}`
                : 'No service selected'}
            </p>
            <p className="font-heading text-lg font-bold text-accent">${booking.total}</p>
          </div>
          <div className="ml-auto flex-1 max-w-[240px]">{actionButton}</div>
        </div>
      </div>
    </div>
  );
}
