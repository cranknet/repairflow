'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';

// New modular components
import { TrackHeader } from '@/components/track/track-header';
import { TrackFooter } from '@/components/track/track-footer';
import { TrackForm } from '@/components/track/track-form';
import { TrackHero } from '@/components/track/track-hero';
import { TrackSummary } from '@/components/track/track-summary';
import { TrackDevice } from '@/components/track/track-device';
import { TrackTimeline } from '@/components/track/track-timeline';
import { ContactSupportModal } from '@/components/track/contact-support-modal';
import { SatisfactionRatingModal } from '@/components/track/satisfaction-rating-modal';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

interface TicketData {
  id: string;
  ticketNumber: string;
  trackingCode: string;
  status: string;
  progress: number;
  deviceBrand: string;
  deviceModel: string;
  deviceIssue: string;
  deviceConditionFront?: string;
  deviceConditionBack?: string;
  priority: string;
  estimatedPrice: number;
  finalPrice?: number;
  createdAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  warrantyDays?: number;
  warrantyText?: string;
  statusHistory: Array<{
    id: string;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  satisfactionRating?: {
    id: string;
    rating: number;
    comment: string | null;
    phoneNumber: string | null;
    verifiedBy: string;
    createdAt: string;
  } | null;
  canSubmitRating?: boolean;
}

interface SocialMedia {
  facebook_url: string;
  youtube_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
}

interface CompanyInfo {
  storeName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}

export function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();

  // State
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<{ retryAfter: number } | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSatisfactionModalOpen, setIsSatisfactionModalOpen] = useState(false);

  const [socialMedia, setSocialMedia] = useState<SocialMedia>({
    facebook_url: '',
    youtube_url: '',
    instagram_url: '',
    linkedin_url: '',
    twitter_url: '',
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    storeName: 'RepairFlow',
    logo: '/default-logo.png',
    address: '',
    phone: '',
    email: '',
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch public settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        setSocialMedia({
          facebook_url: data.facebook_url || '',
          youtube_url: data.youtube_url || '',
          instagram_url: data.instagram_url || '',
          linkedin_url: data.linkedin_url || '',
          twitter_url: data.twitter_url || '',
        });

        let logoPath = '/default-logo.png';
        if (data.company_logo) {
          logoPath = data.company_logo.startsWith('http')
            ? data.company_logo
            : data.company_logo.startsWith('/')
              ? data.company_logo
              : `/${data.company_logo}`;
        }

        setCompanyInfo({
          storeName: data.company_name || data.store_name || 'RepairFlow',
          logo: logoPath,
          address: data.address || '',
          phone: data.company_phone || data.phone || '',
          email: data.email || '',
        });
      })
      .catch(console.error);
  }, []);

  // Polling for real-time updates - defined before handleTrack which uses it
  const startPolling = useCallback((ticketNum: string, code: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch(`/api/track?ticket=${encodeURIComponent(ticketNum)}&code=${encodeURIComponent(code)}`)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data) {
                setTicket(data);
                if (['COMPLETED', 'CANCELLED', 'RETURNED'].includes(data.status)) {
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                }
              }
            }
          })
          .catch(console.error);
      }
    }, 30000);
  }, []);

  // Handle tracking
  const handleTrack = useCallback(async (ticketNumber: string, trackingCode: string) => {
    if (!ticketNumber || !trackingCode) {
      setError(t('unableToLocateTicket'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setRateLimitError(null);
    setTicket(null);

    try {
      const response = await fetch(
        `/api/track?ticket=${encodeURIComponent(ticketNumber)}&code=${encodeURIComponent(trackingCode)}`
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitError({ retryAfter: data.retryAfter || 300 });
          setError(t('tooManyAttempts').replace('{minutes}', Math.ceil((data.retryAfter || 300) / 60).toString()));
        } else {
          setError(data.error || t('unableToLocateTicket'));
        }
        return;
      }

      setTicket(data);
      setError(null);

      // Update URL without reload
      const newUrl = `/track?ticket=${encodeURIComponent(ticketNumber)}&code=${encodeURIComponent(trackingCode)}`;
      router.replace(newUrl, { scroll: false });

      // Start polling for updates (only if not terminal status)
      if (!['COMPLETED', 'CANCELLED', 'RETURNED'].includes(data.status)) {
        startPolling(ticketNumber, trackingCode);
      }
    } catch (err) {
      setError(t('unableToLocateTicket'));
    } finally {
      setIsLoading(false);
    }
  }, [t, router, startPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Read from URL params on mount
  useEffect(() => {
    const ticketFromUrl = searchParams.get('ticket');
    const codeFromUrl = searchParams.get('code');
    if (ticketFromUrl && codeFromUrl) {
      handleTrack(ticketFromUrl.toUpperCase(), codeFromUrl.toUpperCase());
    }
  }, [handleTrack, searchParams]);

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <TrackHeader logo={companyInfo.logo} storeName={companyInfo.storeName} />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {!ticket ? (
          /* Tracking Form */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <TrackForm
              onSubmit={handleTrack}
              isLoading={isLoading}
              error={error}
              rateLimitError={rateLimitError}
              initialTicket={searchParams.get('ticket') || ''}
              initialCode={searchParams.get('code') || ''}
            />

            {/* Contact Support Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {t('contact.form.description')}
              </p>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <EnvelopeIcon className="w-4 h-4" />
                {t('contactSupport')}
              </button>
            </div>
          </div>
        ) : (
          /* Ticket Details */
          <div className="space-y-6">
            {/* Status Hero */}
            <TrackHero
              status={ticket.status}
              progress={ticket.progress}
              ticketNumber={ticket.ticketNumber}
              estimatedCompletion={ticket.estimatedCompletion}
              priority={ticket.priority}
            />

            {/* Summary & Actions */}
            <TrackSummary
              ticketNumber={ticket.ticketNumber}
              trackingCode={ticket.trackingCode}
              createdAt={ticket.createdAt}
              completedAt={ticket.completedAt}
              warrantyDays={ticket.warrantyDays}
              warrantyText={ticket.warrantyText}
              status={ticket.status}
              onContactSupport={() => setIsContactModalOpen(true)}
              onRateService={() => setIsSatisfactionModalOpen(true)}
              canRate={ticket.canSubmitRating || false}
            />

            {/* Device Details (Collapsible) */}
            <TrackDevice
              brand={ticket.deviceBrand}
              model={ticket.deviceModel}
              issue={ticket.deviceIssue}
              conditionFront={ticket.deviceConditionFront}
              conditionBack={ticket.deviceConditionBack}
            />

            {/* Status Timeline */}
            <TrackTimeline
              history={ticket.statusHistory}
              currentStatus={ticket.status}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <TrackFooter
        storeName={companyInfo.storeName}
        logo={companyInfo.logo}
        address={companyInfo.address}
        phone={companyInfo.phone}
        email={companyInfo.email}
        socialMedia={socialMedia}
      />

      {/* Modals */}
      <ContactSupportModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        customerData={ticket ? {
          name: ticket.customer.name,
          email: ticket.customer.email,
          phone: ticket.customer.phone,
        } : undefined}
      />

      {ticket && (ticket.status === 'COMPLETED' || ticket.status === 'REPAIRED') && (
        <SatisfactionRatingModal
          open={isSatisfactionModalOpen}
          onOpenChange={setIsSatisfactionModalOpen}
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          trackingCode={ticket.trackingCode}
          customerName={ticket.customer.name}
          customerEmail={ticket.customer.email}
          canSubmitRating={ticket.canSubmitRating || false}
          existingRating={ticket.satisfactionRating || null}
        />
      )}
    </div>
  );
}
