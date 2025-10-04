import { MapPin, Phone, Mail, Instagram, Clock, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { getStudioSettings, subscribeToStudioSettings, type StudioSettings } from '@/lib/studioService';
import { useTranslations } from '@/lib/translations';

const ContactFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  inquiryType: z.string().min(1, { message: 'Please select an inquiry type.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormData = z.infer<typeof ContactFormSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const { toast } = useToast();
  const { t } = useTranslations();

  useEffect(() => {
    // Load initial studio settings
    const loadStudioSettings = async () => {
      const settings = await getStudioSettings();
      setStudioSettings(settings);
    };
    loadStudioSettings();

    // Set up real-time subscription
    const subscription = subscribeToStudioSettings((settings) => {
      setStudioSettings(settings);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      inquiryType: '',
      subject: '',
      message: '',
    },
  });

  const contactMethods = [
    {
      icon: Phone,
      title: 'Call or Text',
      details: studioSettings?.studio_phone || '(615) 555-NAIL',
      description: 'Quickest way to reach me for urgent questions or booking',
      action: `tel:${(studioSettings?.studio_phone || '(615) 555-NAIL').replace(/\D/g, '')}`
    },
    {
      icon: Mail,
      title: 'Email',
      details: studioSettings?.studio_email || 'hello@francislozanostudio.com',
      description: 'Best for detailed inquiries, custom design consultations',
      action: `mailto:${studioSettings?.studio_email || 'hello@francislozanostudio.com'}`
    },
    {
      icon: Instagram,
      title: 'Instagram DM',
      details: '@francislozanostudio',
      description: 'Follow for daily inspiration and behind-the-scenes content',
      action: 'https://instagram.com/francislozanostudio'
    },
    {
      icon: MessageCircle,
      title: 'Text Message',
      details: studioSettings?.studio_phone || '(615) 555-NAIL',
      description: 'Quick questions, appointment confirmations, or last-minute changes',
      action: `sms:${(studioSettings?.studio_phone || '(615) 555-NAIL').replace(/\D/g, '')}`
    }
  ];

  const businessHours = [
    { day: 'Monday', hours: 'By Appointment' },
    { day: 'Tuesday', hours: '10:00 AM - 6:00 PM' },
    { day: 'Wednesday', hours: '10:00 AM - 6:00 PM' },
    { day: 'Thursday', hours: '10:00 AM - 7:00 PM' },
    { day: 'Friday', hours: '10:00 AM - 7:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 5:00 PM' },
    { day: 'Sunday', hours: 'Closed' }
  ];

  const inquiryTypes = [
    'New Client Consultation',
    'Custom Design Project',
    'Wedding/Event Services',
    'Collaboration Inquiry',
    'Media/Press Request',
    'General Question',
    'Other'
  ];

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          inquiry_type: data.inquiryType,
          subject: data.subject,
          message: data.message,
          status: 'unread'
        });

      if (error) {
        console.error('Error submitting contact form:', error);
        toast({
          title: 'Error',
          description: 'Failed to send your message. Please try again or contact us directly.',
          variant: 'destructive',
        });
        return;
      }

      // Send admin notification email
      try {
        // Get studio configuration from database
        const { getStudioSettings } = await import('@/lib/studioService');
        const studioSettings = await getStudioSettings();
        const studioConfig = studioSettings ? {
          studioName: studioSettings.studio_name,
          studioPhone: studioSettings.studio_phone,
          studioEmail: studioSettings.studio_email,
          websiteUrl: studioSettings.website_url
        } : {};
        
        // Get all active admin emails
        const adminEmailConfigs = JSON.parse(localStorage.getItem('admin-email-configs') || '[]');
        const activeAdminEmails = adminEmailConfigs.filter((config: any) => config.isActive);
        
        // Send to all active admin emails with delay
        const emailsToNotify = activeAdminEmails.length > 0 ? activeAdminEmails : [{ email: 'alerttradingvieww@gmail.com', name: 'Admin' }];
        
        for (let i = 0; i < emailsToNotify.length; i++) {
          const adminConfig = emailsToNotify[i];
          
          // Add delay between emails (except for the first one)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                phone: data.phone || '',
                inquiry_type: data.inquiryType,
                subject: data.subject,
                message: data.message,
                created_at: new Date().toISOString()
              },
              adminEmail: adminConfig.email,
              studioConfig: studioConfig
            }),
          });

          if (!response.ok) {
            console.error(`Failed to send admin notification to ${adminConfig.email}`);
          }
        }
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError);
        // Don't fail the form submission if email fails
      }
      
      // Reset form
      form.reset();
      
      toast({
        title: 'Message Sent!',
        description: 'Thank you for your message. We\'ll get back to you within 24 hours.',
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-foreground">
            {t('contact.title', 'Get in Touch')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('contact.subtitle', "Have questions about services, want to discuss a custom design, or ready to book? I'd love to hear from you and help bring your nail vision to life.")}
          </p>
          <div className="w-24 h-1 bg-gradient-gold mx-auto"></div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t('contact.how_to_reach', 'How to Reach Me')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Choose the method that works best for you. I typically respond within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="hover-lift bg-card border-border">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6">
                    <method.icon size={24} className="text-luxury-black" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2 text-card-foreground">
                    {method.title}
                  </h3>
                  <p className="text-accent font-semibold mb-3">
                    {method.details}
                  </p>
                  <p className="text-muted-foreground text-sm mb-6">
                    {method.description}
                  </p>
                  <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <a href={method.action} target={method.action.startsWith('http') ? '_blank' : '_self'}>
                      Contact Now
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t('contact.send_message', 'Send a Message')}
              </h2>
              <p className="text-lg text-muted-foreground">
                Prefer to write? Use the form below for detailed inquiries or custom project discussions.
              </p>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-center">Contact Form</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(615) 555-0123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="inquiryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inquiry Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select inquiry type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inquiryTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject *</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of your inquiry" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell me about your vision, questions, or how I can help you..."
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-center">
                      <Button 
                        type="submit" 
                        size="lg" 
                        disabled={isSubmitting}
                        className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2" size={20} />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Hours & Location */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Business Hours */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center">
                  <Clock className="mr-3 text-accent" size={24} />
                  Studio Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {businessHours.map((schedule) => (
                    <div key={schedule.day} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                      <span className="font-medium text-card-foreground">{schedule.day}</span>
                      <span className="text-muted-foreground">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> All appointments are by reservation only. 
                    Walk-ins are not available to ensure each client receives dedicated attention.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center">
                  <MapPin className="mr-3 text-accent" size={24} />
                  Studio Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">Nashville, Tennessee</h4>
                    <p className="text-muted-foreground">
                      Private home studio in a convenient Nashville location. 
                      Full address provided upon booking confirmation for privacy and security.
                    </p>
                  </div>
                  
                  <div className="bg-secondary p-4 rounded-lg">
                    <h5 className="font-semibold text-card-foreground mb-2">Getting Here</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Easily accessible from downtown Nashville</li>
                      <li>• Free parking available on-site</li>
                      <li>• Detailed directions sent with confirmation</li>
                      <li>• Please arrive 5 minutes early for check-in</li>
                    </ul>
                  </div>

                  <div>
                    <Button asChild className="w-full bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold">
                      <Link to="/booking">Book to Get Address</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-20 bg-luxury-black text-pure-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
            Looking for Something Specific?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Need quick answers? Check out these helpful resources or reach out directly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Button asChild variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-luxury-black">
              <Link to="/services">Services & Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-luxury-black">
              <Link to="/booking">Booking Policies</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-luxury-black">
              <Link to="/gallery">View Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;