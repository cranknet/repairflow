'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';

const createContactSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('nameRequired')),
  email: z.string().email(t('emailInvalid') || 'Invalid email'),
  phone: z.string().optional(),
  message: z.string().min(1, t('messageRequired') || 'Message is required'),
  ticketId: z.string().optional(),
});

interface ContactFormProps {
  ticketId?: string;
  variant?: 'card' | 'plain';
  showHeader?: boolean;
  onSubmitted?: () => void;
  defaultValues?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export function ContactForm({
  ticketId,
  variant = 'card',
  showHeader = true,
  onSubmitted,
  defaultValues,
}: ContactFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactSchema = createContactSchema(t);
  type ContactFormData = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      ticketId: ticketId || undefined,
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          message: data.message,
          ticketId: ticketId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: t('error'),
            description: t('contact.error.rate_limit'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('error'),
            description: result.error || t('contact.error'),
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: t('success'),
        description: t('contact.success'),
      });
      reset();
      onSubmitted?.();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('contact.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {ticketId && (
        <input type="hidden" {...register('ticketId')} value={ticketId} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t('contact.form.name')}</Label>
          <Input
            id="contact-name"
            {...register('name')}
            placeholder={t('contact.form.name')}
            errorText={errors.name?.message}
            required
            disabled={isSubmitting || !!defaultValues?.name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email">{t('contact.form.email')}</Label>
          <Input
            id="contact-email"
            type="email"
            {...register('email')}
            placeholder={t('contact.form.email')}
            errorText={errors.email?.message}
            required
            disabled={isSubmitting || !!defaultValues?.email}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-phone">{t('contact.form.phone')}</Label>
        <Input
          id="contact-phone"
          type="tel"
          {...register('phone')}
          placeholder={t('contact.form.phone')}
          errorText={errors.phone?.message}
          disabled={isSubmitting || !!defaultValues?.phone}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{t('contact.form.message')}</Label>
        <Textarea
          id="contact-message"
          {...register('message')}
          placeholder={t('contact.form.message')}
          errorText={errors.message?.message}
          required
          disabled={isSubmitting}
          rows={5}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('contact.form.submitting') : t('contact.form.submit')}
      </Button>
    </form>
  );

  if (variant === 'plain') {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="space-y-1">
            <CardTitle className="text-xl">{t('contact.form.title')}</CardTitle>
            <CardDescription>{t('contact.form.description')}</CardDescription>
          </div>
        )}
        {form}
      </div>
    );
  }

  return (
    <Card className="mt-8">
      {showHeader && (
        <CardHeader>
          <CardTitle>{t('contact.form.title')}</CardTitle>
          <CardDescription>{t('contact.form.description')}</CardDescription>
        </CardHeader>
      )}
      <CardContent>{form}</CardContent>
    </Card>
  );
}

