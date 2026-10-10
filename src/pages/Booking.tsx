import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { ExpressBookingForm } from '@/components/booking/ExpressBookingForm';
import { useTranslations } from '@/lib/translations';

const Booking = () => {
  const { t } = useTranslations();

  const policies = [
    {
      title: 'Depósito & Reserva ($20)',
      items: [
        'Se requiere un depósito de $20 para asegurar cualquier cita.',
        'La cita no queda definitivamente reservada hasta cumplir las condiciones de reserva.',
        'El balance restante se abona al finalizar el servicio en el estudio.',
        'Se acepta efectivo, Zelle, Venmo y tarjetas principales.'
      ]
    },
    {
      title: 'Horario & Puntualidad',
      items: [
        'Atendemos de Lunes a Sábado en dos bloques:',
        'Mañana: 8:30 a. m. – 1:30 p. m. | Tarde: 3:00 p. m. – ~7:00 p. m.',
        'Pausa estricta: 1:30 p. m. a 3:00 p. m. (no se agendan citas en este horario).',
        'Domingos cerrado. Por favor llegar 5 minutos antes de su hora.'
      ]
    },
    {
      title: 'Builder Gel & Uñas Naturales',
      items: [
        'No realizo mantenimiento ni refill de Builder Gel.',
        'En clientas recurrentes se retira el 80% del producto anterior y se coloca material nuevo.',
        'Si tienes producto previo para retirar, indícalo al reservar (duración: 3 horas vs 2 horas set nuevo).',
        'No ofrecemos servicios en acrílico ni Polygel.'
      ]
    },
    {
      title: 'Keratina & Diseños Especiales',
      items: [
        'Keratina desde $150: duración de 3 a 5 horas según largo y volumen del cabello.',
        'El precio final de Nail Art, 3D y efectos especiales varía según complejidad.',
        'Los precios "desde" son iniciales y pueden variar según largo y diseño.',
        'Agradecemos enviar una foto de referencia para confirmar cotizaciones personalizadas.'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How far in advance should I book?',
      answer: 'For best availability, book 1-2 weeks in advance. Last-minute appointments may be available for simple services.'
    },
    {
      question: 'What if I\'m allergic to certain products?',
      answer: 'Please inform me of any allergies during booking. I can accommodate most sensitivities with alternative products.'
    },
    {
      question: 'Can I bring inspiration photos?',
      answer: 'Absolutely! Bring photos or Pinterest boards to help communicate your vision. We\'ll discuss feasibility during consultation.'
    },
    {
      question: 'Do you offer group appointments?',
      answer: 'Private studio appointments are individual only. For special events, please contact me to discuss options.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-background py-8 sm:py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-6 text-foreground">
            {t('booking.title', 'Book Your Appointment')}
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3 sm:mb-4 px-2">
            {t('booking.subtitle', "Ready to experience luxury nail artistry? Schedule your private appointment and let's create something beautiful together in my Nashville studio.")}
          </p>
          <p className="text-xs sm:text-sm text-accent font-medium mb-5 sm:mb-8">Tres pasos rápidos — cuándo, qué servicio y tus datos.</p>
          <div className="w-16 sm:w-24 h-1 bg-gradient-gold mx-auto rounded-full"></div>
        </div>
      </section>

      {/* Express Booking Form */}
      <section className="py-6 sm:py-12 md:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <ExpressBookingForm />
        </div>
      </section>

      {/* Booking Policies */}
      <section className="py-10 sm:py-16 md:py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-6">
                Booking Policies
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Please review these important policies before booking your appointment to ensure 
                a smooth and enjoyable experience for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {policies.map((policy, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl text-card-foreground">
                      {policy.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {policy.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-muted-foreground text-sm flex items-start">
                          <span className="text-accent mr-2 flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Common questions about booking and preparing for your appointment
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-6">
                    <h3 className="font-heading text-lg font-semibold text-card-foreground mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-lg text-muted-foreground mb-6">
                Have another question? I'm here to help!
              </p>
              <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Link to="/contact">Contact Francis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-luxury-black text-pure-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Nails?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Don't wait—my calendar fills up quickly! Book your appointment today and 
            experience the difference of truly personalized nail artistry.
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
              onClick={() => document.getElementById('ex-when')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Calendar className="mr-2" size={20} />
              Book Now
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-luxury-black">
              <Link to="/services">View Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Booking;