import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { useDemoBooking } from '@/components/booking/demo/shared';
import { StyleWizard } from '@/components/booking/demo/StyleWizard';
import { StyleOnePage } from '@/components/booking/demo/StyleOnePage';
import { StyleTabs } from '@/components/booking/demo/StyleTabs';
import { StyleAccordion } from '@/components/booking/demo/StyleAccordion';
import { StyleExpress } from '@/components/booking/demo/StyleExpress';

const STYLES = [
  {
    id: 'wizard',
    name: 'Step Wizard',
    blurb: 'One step at a time with a progress bar — service, time, details, review. The familiar flow, simplified.',
    Component: StyleWizard,
  },
  {
    id: 'onepage',
    name: 'One Page',
    blurb: 'Everything on a single screen with numbered sections and a live summary bar that follows you.',
    Component: StyleOnePage,
  },
  {
    id: 'tabs',
    name: 'Tabbed',
    blurb: 'Three tabs like a mobile app — Service, When, Details — with chips showing your picks.',
    Component: StyleTabs,
  },
  {
    id: 'accordion',
    name: 'Accordion',
    blurb: 'Sections open one after another; each finished step collapses into an editable summary row.',
    Component: StyleAccordion,
  },
  {
    id: 'express',
    name: 'Express',
    blurb: 'The fastest path: date first, one service from a clean menu, two fields, done.',
    Component: StyleExpress,
  },
] as const;

const BookingDemo = () => {
  const booking = useDemoBooking();
  const [activeId, setActiveId] = useState<string>('wizard');
  const active = STYLES.find((style) => style.id === activeId) ?? STYLES[0];
  const ActiveStyle = active.Component;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent mb-5">
            <FlaskConical size={14} />
            Demo · same service data in every style
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4 text-foreground">
            Booking Page — 5 Styles
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare five booking layouts. Your selections stay as you switch, so you can see the
            same booking in every style. Nothing is saved or emailed.
          </p>
          <div className="w-24 h-1 bg-gradient-gold mx-auto mt-6" />
        </div>
      </section>

      {/* Style switcher */}
      <div className="sticky top-16 z-30 border-y border-border bg-background/90 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STYLES.map((style, index) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setActiveId(style.id)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                  activeId === style.id
                    ? 'border-accent bg-gradient-gold text-luxury-black shadow-gold'
                    : 'border-border text-muted-foreground hover:border-accent/60 hover:text-accent'
                )}
              >
                {index + 1} · {style.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active style */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Style {STYLES.findIndex((style) => style.id === active.id) + 1} · {active.name}
              </h2>
              <p className="mt-2 text-muted-foreground">{active.blurb}</p>
            </div>

            <ActiveStyle booking={booking} />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BookingDemo;
