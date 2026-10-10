import { ArrowDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/translations';
import {
  categoryLabel,
  DateStrip,
  DemoConfirmation,
  DemoLoader,
  DetailsFields,
  formatDuration,
  TimePills,
  type DemoBooking,
} from './shared';

interface StyleExpressProps {
  booking: DemoBooking;
}

export function StyleExpress({ booking }: StyleExpressProps) {
  const { translateByText } = useTranslations();

  if (booking.confirmation) {
    return <DemoConfirmation booking={booking} styleName="Express" />;
  }

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const actionLabel = !booking.dateReady
    ? 'Pick date & time'
    : !booking.servicesReady
    ? 'Choose a service'
    : !booking.detailsReady
    ? 'Add your name & phone'
    : `Book now · $${booking.total}`;

  const handleAction = () => {
    if (!booking.dateReady) goTo('ex-when');
    else if (!booking.servicesReady) goTo('ex-service');
    else if (!booking.detailsReady) goTo('ex-you');
    else booking.confirm();
  };

  return (
    <div className="mx-auto max-w-xl pb-28 animate-fade-in">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Express booking</p>
        <h2 className="font-heading text-3xl font-bold text-foreground mt-1">Book in under a minute</h2>
        <p className="text-sm text-muted-foreground mt-1">Three quick steps — when, what, and who.</p>
      </div>

      {/* 1 — When */}
      <section id="ex-when" className="scroll-mt-36">
        <StepHeading number={1} title="When suits you?" />
        <DateStrip selected={booking.date} onSelect={booking.selectDate} large />
        <div className="mt-3">
          <TimePills date={booking.date} selected={booking.time} onSelect={booking.selectTime} columns={4} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {booking.date
            ? `${format(booking.date, 'EEEE, MMMM d')} · ${formatDuration(booking.duration || 0)} appointment`
            : 'Mon–Sat · 7 AM–5 PM · closed Sundays'}
        </p>
      </section>

      {/* 2 — Service (single pick, menu style) */}
      <section id="ex-service" className="mt-8 scroll-mt-36">
        <StepHeading number={2} title="What would you like?" />
        {booking.isLoading ? (
          <DemoLoader />
        ) : (
          <div className="rounded-2xl border border-border bg-card px-4 py-1 shadow-elegant">
            {booking.services.map((service) => {
              const selected = booking.isSelected(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => booking.selectOnly(service.id)}
                  className={cn(
                    'block w-full border-b border-border/60 py-3 text-left last:border-0 transition-colors',
                    selected ? 'text-card-foreground' : 'hover:text-accent'
                  )}
                >
                  <span className="flex items-baseline gap-2">
                    <Check
                      size={15}
                      strokeWidth={3}
                      className={cn('shrink-0 translate-y-0.5', selected ? 'text-accent' : 'text-transparent')}
                    />
                    <span className={cn('min-w-0 truncate', selected && 'font-semibold')}>{translateByText(service.name)}</span>
                    <span className="min-w-4 flex-1 border-b border-dotted border-border/80" />
                    <span className={cn('font-semibold', selected ? 'text-accent' : 'text-card-foreground')}>
                      ${service.price}
                    </span>
                  </span>
                  <span className="ml-6 block text-xs text-muted-foreground">
                    {formatDuration(service.duration)} · {categoryLabel(service.category)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3 — You */}
      <section id="ex-you" className="mt-8 scroll-mt-36">
        <StepHeading number={3} title="Who's booking?" />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-elegant sm:p-5">
          <DetailsFields info={booking.info} onChange={booking.setInfoField} showNotes={false} />
        </div>
      </section>

      {/* Sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {booking.servicesReady && booking.dateReady
                ? `${booking.selectedServices[0].name} · ${format(booking.date!, 'MMM d')} ${booking.time}`
                : booking.dateReady
                ? 'Service not picked'
                : 'Date not picked'}
            </p>
            <p className="font-heading text-lg font-bold text-accent">${booking.total}</p>
          </div>
          <Button
            onClick={handleAction}
            className={cn(
              'ml-auto font-semibold',
              booking.readyToConfirm
                ? 'bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {actionLabel}
            {!booking.readyToConfirm && <ArrowDown size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-gold text-luxury-black text-xs font-bold">
        {number}
      </span>
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );
}
