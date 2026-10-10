import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
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

const STEPS = [
  { label: 'Service', icon: Check },
  { label: 'Date & Time', icon: Clock },
  { label: 'Your Details', icon: User },
  { label: 'Review', icon: Calendar },
];

interface StyleWizardProps {
  booking: DemoBooking;
}

export function StyleWizard({ booking }: StyleWizardProps) {
  const [step, setStep] = useState(1);
  const { translateByText } = useTranslations();

  if (booking.confirmation) {
    return <DemoConfirmation booking={booking} styleName="Step Wizard" />;
  }

  const stepValid =
    step === 1
      ? booking.servicesReady
      : step === 2
      ? booking.dateReady
      : step === 3
      ? booking.detailsReady
      : booking.readyToConfirm;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Card className="bg-card border-border/60 shadow-elegant">
        <CardContent className="p-5 sm:p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center">
              {STEPS.map((item, index) => {
                const number = index + 1;
                const done = step > number;
                const active = step === number;
                return (
                  <div key={item.label} className={cn('flex items-center', index > 0 && 'flex-1')}>
                    {index > 0 && (
                      <div className="mx-2 h-0.5 flex-1 bg-muted sm:mx-4">
                        <div
                          className={cn(
                            'h-full bg-gradient-gold transition-all duration-500',
                            done ? 'w-full' : 'w-0'
                          )}
                        />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                          done && 'border-accent bg-accent text-luxury-black',
                          active && 'border-accent bg-gradient-gold text-luxury-black shadow-gold',
                          !done && !active && 'border-muted-foreground/40 text-muted-foreground'
                        )}
                      >
                        {done ? <Check size={16} strokeWidth={3} /> : number}
                      </span>
                      <span
                        className={cn(
                          'hidden sm:block text-xs font-medium',
                          active ? 'text-card-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground sm:hidden">
              Step {step} of 4 · {STEPS[step - 1].label}
            </p>
          </div>

          {/* Step content */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Choose your service</h2>
                <p className="text-sm text-muted-foreground">Pick one or more — you can combine services.</p>
              </div>

              {booking.isLoading ? (
                <DemoLoader />
              ) : (
                <div className="space-y-3">
                  {booking.services.map((service) => {
                    const selected = booking.isSelected(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => booking.toggleService(service.id)}
                        className={cn(
                          'w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200',
                          selected
                            ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                            : 'border-border bg-card hover:border-accent/50'
                        )}
                      >
                        <DemoCheck checked={selected} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-heading font-semibold text-card-foreground truncate">
                              {translateByText(service.name)}
                            </span>
                            <span className="font-semibold text-accent">${service.price}</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground truncate">
                            {formatDuration(service.duration)} · {categoryLabel(service.category)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {booking.servicesReady && (
                <p className="text-center text-sm text-muted-foreground animate-fade-in">
                  {booking.selectedServices.length} selected · {formatDuration(booking.duration)} ·{' '}
                  <span className="text-accent font-semibold">${booking.total}</span>
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Pick date & time</h2>
                <p className="text-sm text-muted-foreground">Open Monday–Saturday, 7 AM–5 PM (closed Sundays).</p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-3 flex justify-center">
                  <CalendarPicker
                    mode="single"
                    selected={booking.date}
                    onSelect={(date) => booking.selectDate(date)}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || date.getDay() === 0;
                    }}
                    initialFocus
                    className="p-0"
                  />
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-card-foreground">
                    {booking.date ? `Available on ${format(booking.date, 'EEEE, MMMM d')}` : 'Choose a date first'}
                  </p>
                  <TimePills date={booking.date} selected={booking.time} onSelect={booking.selectTime} columns={2} />
                  <div className="mt-4 xl:hidden">
                    <DateStripInline booking={booking} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Your details</h2>
                <p className="text-sm text-muted-foreground">We'll send your confirmation here.</p>
              </div>
              <DetailsFields info={booking.info} onChange={booking.setInfoField} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Review & confirm</h2>
                <p className="text-sm text-muted-foreground">Everything look right?</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-5">
                <SelectionSummary booking={booking} />
                <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  <p className="font-medium text-card-foreground">{booking.info.fullName}</p>
                  <p>{booking.info.email}</p>
                  <p>{booking.info.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Floating footer */}
          <div className="sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <span className="hidden sm:block text-sm text-muted-foreground">
              {booking.servicesReady && (
                <>
                  {booking.selectedServices.length} service{booking.selectedServices.length !== 1 ? 's' : ''} ·{' '}
                  <span className="text-accent font-semibold">${booking.total}</span>
                </>
              )}
            </span>

            {step < 4 ? (
              <Button
                type="button"
                disabled={!stepValid}
                onClick={() => setStep((current) => Math.min(4, current + 1))}
                className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
              >
                Continue
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!stepValid}
                onClick={booking.confirm}
                className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
              >
                Confirm booking
                <Check size={16} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Small horizontal date fallback shown next to the month calendar on small screens
function DateStripInline({ booking }: { booking: DemoBooking }) {
  return (
    <div className="pt-1">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Or jump to a day</p>
      <DateStrip selected={booking.date} onSelect={booking.selectDate} days={14} />
    </div>
  );
}
