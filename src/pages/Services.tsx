import { Clock, Star, Palette, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getStudioSettings, subscribeToStudioSettings, type StudioSettings } from '@/lib/studioService';
import { useTranslations } from '@/lib/translations';

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

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    fetchServices();
    loadStudioSettings();
    
    // Set up real-time subscription
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'services' },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    const studioSubscription = subscribeToStudioSettings((settings) => {
      setStudioSettings(settings);
    });

    return () => {
      supabase.removeChannel(servicesSubscription);
      if (studioSubscription) {
        studioSubscription.unsubscribe();
      }
    };
  }, []);

  const loadStudioSettings = async () => {
    const settings = await getStudioSettings();
    setStudioSettings(settings);
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categoryConfig = {
    'manicures': { title: 'Classic Manicures & Pedicures', icon: Star },
    'pedicures': { title: 'Classic Manicures & Pedicures', icon: Star },
    'extensions': { title: 'Nail Extensions', icon: Palette },
    'systems': { title: 'Nail Systems', icon: Palette },
    'nail-art': { title: 'Nail Art Tiers', icon: Clock },
    'add-ons': { title: 'Add-On Services', icon: Star },
    'general': { title: 'Additional Services', icon: Star }
  };

  const addOnServices = [
    { name: "Cuticle Oil Treatment", price: "+$5" },
    { name: "Paraffin Hand Treatment", price: "+$15" },
    { name: "Extended Hand Massage", price: "+$10" },
    { name: "Nail Repair (per nail)", price: "+$5" },
    { name: "Shape Change", price: "+$10" },
    { name: "Rush Service (48hr notice)", price: "+$25" }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-foreground">
            {t('services.title', 'Services & Pricing')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('services.subtitle', 'Discover our comprehensive menu of luxury nail services, each crafted to deliver exceptional quality and artistry. All services include consultation and aftercare guidance.')}
          </p>
          <div className="w-24 h-1 bg-gradient-gold mx-auto"></div>
        </div>
      </section>

      {/* Services Menu */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : Object.entries(groupedServices).length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No services available</p>
              <p className="text-sm">Services are being updated. Please check back soon.</p>
            </div>
          ) : (
            Object.entries(groupedServices).map(([categoryKey, categoryServices]) => {
              const config = categoryConfig[categoryKey] || { title: categoryKey, icon: Star };
              return (
                <div key={categoryKey} className="mb-16">
                  <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
                      <config.icon size={32} className="text-luxury-black" />
                    </div>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                      {config.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryServices.map((service) => (
                      <Card key={service.id} className="hover-lift bg-card border-border relative">
                        <CardHeader>
                          <CardTitle className="font-heading text-xl text-card-foreground flex items-center justify-between">
                            <span>{service.name}</span>
                            <span className="text-lg font-bold text-accent">${service.price}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground mb-4">{service.description}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock size={16} className="mr-2" />
                            <span>{service.duration} min</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Static Add-On Services Section */}
          {Object.keys(groupedServices).length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-luxury-black" />
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                  Add-On Services
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addOnServices.map((addon, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">{addon.name}</span>
                    <span className="font-bold text-accent">{addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Policies */}
          <div className="bg-secondary rounded-lg p-8 mb-12">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">{t('services.booking_policies', 'Booking Policies')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Deposits & Payment</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 50% deposit required to secure appointment</li>
                  <li>• Cash, Venmo, and card payments accepted</li>
                  <li>• Gratuity appreciated but not required</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Cancellation Policy</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 48-hour notice required for cancellations</li>
                  <li>• Same-day cancellations forfeit deposit</li>
                  <li>• Late arrivals may result in shortened service</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Fills & Touch-Ups</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Fills from other salons require removal fee</li>
                  <li>• 2-week guarantee on chip-resistant services</li>
                  <li>• Complimentary minor adjustments within 3 days</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Health & Safety</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Please reschedule if feeling unwell</li>
                  <li>• All tools are sanitized and sterilized</li>
                  <li>• Allergic reactions: please inform before service</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="font-heading text-3xl font-bold text-foreground mb-4">
              {t('services.ready_to_book', 'Ready to Book Your Appointment?')}
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Final pricing for nail art is determined based on complexity and design detail. 
              Book your consultation to discuss your vision and receive an accurate quote.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold">
                <Link to="/booking">{t('nav.book_now', 'Book Now')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Link to="/gallery">{t('nav.gallery', 'View Gallery')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;