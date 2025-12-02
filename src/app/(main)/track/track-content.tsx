'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { format, formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { QRCodeSVG } from 'qrcode.react';
import {
  InboxIcon,
  CogIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ClipboardIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  PhotoIcon,
  ClockIcon,
  CheckBadgeIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ContactSupportModal } from '@/components/track/contact-support-modal';
import { SatisfactionRatingModal } from '@/components/track/satisfaction-rating-modal';

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

const STATUS_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}> = {
  RECEIVED: {
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-800 dark:text-blue-200',
    icon: InboxIcon,
    label: 'statusReceived',
    description: 'statusReceivedDesc',
  },
  IN_PROGRESS: {
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-800 dark:text-amber-200',
    icon: CogIcon,
    label: 'statusInProgress',
    description: 'statusInProgressDesc',
  },
  WAITING_FOR_PARTS: {
    color: '#F97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    textColor: 'text-orange-800 dark:text-orange-200',
    icon: ArchiveBoxIcon,
    label: 'statusWaitingForParts',
    description: 'statusWaitingForPartsDesc',
  },
  REPAIRED: {
    color: '#10B981',
    bgColor: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-800 dark:text-green-200',
    icon: CheckCircleIcon,
    label: 'statusRepaired',
    description: 'statusRepairedDesc',
  },
  COMPLETED: {
    color: '#059669',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    textColor: 'text-emerald-800 dark:text-emerald-200',
    icon: CheckBadgeIcon,
    label: 'statusCompleted',
    description: 'statusCompletedDesc',
  },
  RETURNED: {
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    textColor: 'text-purple-800 dark:text-purple-200',
    icon: TruckIcon,
    label: 'statusReturned',
    description: 'statusReturnedDesc',
  },
  CANCELLED: {
    color: '#EF4444',
    bgColor: 'bg-red-50 dark:bg-red-950',
    textColor: 'text-red-800 dark:text-red-200',
    icon: XCircleIcon,
    label: 'statusCancelled',
    description: 'statusCancelledDesc',
  },
};

export function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [ticketNumber, setTicketNumber] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState<{ retryAfter: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [expandedPhotos, setExpandedPhotos] = useState<string | null>(null);
  const [isSatisfactionModalOpen, setIsSatisfactionModalOpen] = useState(false);
  const [socialMedia, setSocialMedia] = useState({
    facebook_url: '',
    youtube_url: '',
    instagram_url: '',
    linkedin_url: '',
    twitter_url: '',
  });
  const [companyInfo, setCompanyInfo] = useState({
    storeName: 'RepairFlow',
    logo: '/default-logo.png',
    address: '',
    phone: '',
    email: '',
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [photographer, setPhotographer] = useState<{ name: string; username: string; profileUrl: string } | null>(null);
  const [unsplashEnabled, setUnsplashEnabled] = useState(false);

  // Fetch public settings and background image
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
        
        // Get company logo with proper path handling
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

        // Handle Unsplash integration
        const isUnsplashEnabled = data.UNSPLASH_ENABLED === 'true';
        setUnsplashEnabled(isUnsplashEnabled);

        if (isUnsplashEnabled) {
          // Try to fetch Unsplash image
          fetch('/api/unsplash/search?query=repair workshop tools')
            .then((res) => res.json())
            .then((unsplashData) => {
              if (unsplashData.ok && unsplashData.data) {
                setBackgroundImage(unsplashData.data.url);
                setPhotographer({
                  name: unsplashData.data.photographer.name,
                  username: unsplashData.data.photographer.username,
                  profileUrl: unsplashData.data.photographer.profileUrl,
                });
              } else {
                // Fallback to default track image
                const defaultImage = data.default_track_image || '/default-track-bg.png';
                setBackgroundImage(defaultImage);
                setPhotographer(null);
              }
            })
            .catch(() => {
              // Fallback to default track image on error
              const defaultImage = data.default_track_image || '/default-track-bg.png';
              setBackgroundImage(defaultImage);
              setPhotographer(null);
            });
        } else {
          // Use default track image when Unsplash is disabled
          const defaultImage = data.default_track_image || '/default-track-bg.png';
          setBackgroundImage(defaultImage);
          setPhotographer(null);
        }
      })
      .catch(console.error);
  }, []);

  // Handle tracking
  const handleTrack = async (ticketNum?: string, code?: string) => {
    const ticketNumValue = ticketNum || ticketNumber.trim();
    const codeValue = code || trackingCode.trim();

    if (!ticketNumValue || !codeValue) {
      setError(t('unableToLocateTicket'));
      return;
    }

    setIsLoading(true);
    setError('');
    setRateLimitError(null);
    setTicket(null);

    try {
      const response = await fetch(`/api/track?ticket=${encodeURIComponent(ticketNumValue)}&code=${encodeURIComponent(codeValue)}`);
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
      setError('');

      // Update URL without reload
      const newUrl = `/track?ticket=${encodeURIComponent(ticketNumValue)}&code=${encodeURIComponent(codeValue)}`;
      router.replace(newUrl, { scroll: false });

      // Start polling for updates (only if not terminal status)
      if (!['COMPLETED', 'CANCELLED', 'RETURNED'].includes(data.status)) {
        startPolling(ticketNumValue, codeValue);
      }
    } catch (err) {
      setError(t('unableToLocateTicket'));
    } finally {
      setIsLoading(false);
    }
  };

  // Polling for real-time updates
  const startPolling = (ticketNum: string, code: string) => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 30 seconds when tab is active
    pollingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch(`/api/track?ticket=${encodeURIComponent(ticketNum)}&code=${encodeURIComponent(code)}`)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data) {
                setTicket(data);
                // Stop polling if terminal status
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
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Read from URL params
  useEffect(() => {
    const ticketFromUrl = searchParams.get('ticket');
    const codeFromUrl = searchParams.get('code');
    if (ticketFromUrl && codeFromUrl) {
      setTicketNumber(ticketFromUrl.toUpperCase());
      setTrackingCode(codeFromUrl.toUpperCase());
      handleTrack(ticketFromUrl.toUpperCase(), codeFromUrl.toUpperCase());
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.RECEIVED;
  };

  const getProgressPercentage = () => {
    if (!ticket) return 0;
    return ticket.progress || 0;
  };

  const getEstimatedCompletionText = () => {
    if (!ticket?.estimatedCompletion) return null;
    const date = new Date(ticket.estimatedCompletion);
    const now = new Date();
    const days = differenceInDays(date, now);
    const hours = differenceInHours(date, now) % 24;

    if (days > 0) {
      return `${days} ${t('days')}${hours > 0 ? ` ${hours}h` : ''}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return t('onSchedule');
    }
  };

  const getTrackingUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/track?ticket=${encodeURIComponent(ticketNumber)}&code=${encodeURIComponent(trackingCode)}`;
  };

  return (
    <div 
      className={`min-h-screen relative ${!backgroundImage ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: backgroundImage ? 'fixed' : undefined,
      }}
    >
      {/* Background overlay for text legibility */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-sm" />
      )}

      {/* Photographer attribution (only for Unsplash images) */}
      {photographer && (
        <div className="absolute bottom-4 left-4 z-40 text-white/80 text-xs">
          <a
            href={photographer.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors underline"
          >
            {t('images.unsplash.photographer', { name: photographer.name })}
          </a>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={companyInfo.logo}
                alt={companyInfo.storeName}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  // Fallback to default logo if image fails to load
                  e.currentTarget.src = '/default-logo.png';
                }}
              />
              <span className="text-2xl font-bold text-primary hidden sm:inline">{companyInfo.storeName}</span>
            </Link>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  {t('home')}
                </Link>
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {!ticket ? (
          /* Tracking Form */
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {t('trackYourRepairStatus')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t('enterTicketAndCode')}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('trackYourTicket')}</CardTitle>
                <CardDescription>{t('enterTicketAndCode')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticketNumber">{t('ticketNumberLabel')}</Label>
                      <Input
                        id="ticketNumber"
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                        placeholder="TKT-XXXXX"
                        required
                        disabled={isLoading}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trackingCode">{t('trackingCodeLabel')}</Label>
                      <Input
                        id="trackingCode"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                        placeholder="8-character code"
                        required
                        disabled={isLoading}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <CogIcon className="h-4 w-4 mr-2 animate-spin" />
                        {t('tracking')}
                      </>
                    ) : (
                      t('trackButton')
                    )}
                  </Button>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                    {error}
                  </div>
                )}

                {rateLimitError && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      {t('tooManyAttempts').replace('{minutes}', Math.ceil(rateLimitError.retryAfter / 60).toString())}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                      Retry after: {Math.ceil(rateLimitError.retryAfter / 60)} minutes
                    </p>
                  </div>
                )}

                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  {t('lostTrackingCode')}
                </p>
              </CardContent>
            </Card>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('contact.form.description')}
              </p>
              <Button
                variant="outlined"
                className="gap-2 w-full md:w-auto justify-center"
                onClick={() => setIsContactModalOpen(true)}
              >
                <EnvelopeIcon className="h-4 w-4" />
                {t('contactSupport')}
              </Button>
            </div>
          </div>
        ) : (
          /* Ticket Details */
          <div className="space-y-6" ref={printRef}>
            {/* Status Badge */}
            {(() => {
              const statusConfig = getStatusConfig(ticket.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Card className={`${statusConfig.bgColor} border-2`} style={{ borderColor: statusConfig.color }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${statusConfig.bgColor}`} style={{ backgroundColor: `${statusConfig.color}20` }}>
                        <StatusIcon className={`h-8 w-8 ${statusConfig.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: statusConfig.color }}>
                          {t(statusConfig.label)}
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300">
                          {t(statusConfig.description)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Progress Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  {t('progress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('progress')}</span>
                    <span className="font-semibold">{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${getProgressPercentage()}%`,
                        background: `linear-gradient(90deg, ${getStatusConfig(ticket.status).color}, ${getStatusConfig(ticket.status).color}dd)`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('ticketSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('ticketNumber')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-semibold text-lg">{ticket.ticketNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ticket.ticketNumber)}
                          className="h-8 w-8 p-0"
                        >
                          <ClipboardIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('trackingCodeLabel')}</Label>
                      <p className="font-mono text-sm mt-1">{ticket.trackingCode}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('submissionDate')}</Label>
                      <p className="text-sm mt-1">{format(new Date(ticket.createdAt), 'PPpp')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('priorityLevel')}</Label>
                      <Badge className="mt-1">
                        {ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? t('express') : t('standard')}
                      </Badge>
                    </div>
                    {ticket.estimatedCompletion && (
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">{t('estimatedCompletion')}</Label>
                        <p className="text-sm mt-1">
                          {format(new Date(ticket.estimatedCompletion), 'PP')} ({getEstimatedCompletionText()})
                        </p>
                      </div>
                    )}
                    {ticket.warrantyDays && ticket.status === 'COMPLETED' && (
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">{t('warranty')}</Label>
                        <p className="text-sm mt-1">
                          {ticket.warrantyDays} {t('days')} {t('warrantyIncluded')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                  <Button variant="outlined" onClick={handlePrint} className="gap-2">
                    <PrinterIcon className="h-4 w-4" />
                    {t('printSummary')}
                  </Button>
                  {ticket.status === 'COMPLETED' && (
                    <Button variant="outlined" className="gap-2">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      {t('downloadInvoice')}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    className="gap-2"
                    onClick={() => setIsContactModalOpen(true)}
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    {t('contactSupport')}
                  </Button>
                  {(ticket.status === 'COMPLETED' || ticket.status === 'REPAIRED') && (
                    <Button
                      variant="outlined"
                      className="gap-2"
                      onClick={() => setIsSatisfactionModalOpen(true)}
                    >
                      <StarIcon className="h-4 w-4" />
                      {t('satisfaction.rating_label')}
                    </Button>
                  )}
                  <Button variant="outlined" onClick={() => setShowQR(!showQR)} className="gap-2">
                    <QrCodeIcon className="h-4 w-4" />
                    {t('shareTracking')}
                  </Button>
                </div>

                {/* QR Code Modal */}
                {showQR && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQR(false)}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{t('shareTracking')}</h3>
                        <button
                          onClick={() => setShowQR(false)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <XCircleIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <QRCodeSVG value={getTrackingUrl()} size={200} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs font-mono">
                          {ticket.ticketNumber} - {ticket.trackingCode}
                        </p>
                        <Button onClick={() => copyToClipboard(getTrackingUrl())} className="gap-2 w-full">
                          <ClipboardIcon className="h-4 w-4" />
                          {copied ? t('copied') : t('copyToClipboard')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('deviceDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('deviceBrand')}</Label>
                      <p className="text-sm font-semibold mt-1">{ticket.deviceBrand}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('deviceModel')}</Label>
                      <p className="text-sm font-semibold mt-1">{ticket.deviceModel}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">{t('reportedIssues')}</Label>
                      <p className="text-sm mt-1">{ticket.deviceIssue}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {(ticket.deviceConditionFront || ticket.deviceConditionBack) && (
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">{t('conditionPhotos')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {ticket.deviceConditionFront && (
                            <div
                              className="relative cursor-pointer group"
                              onClick={() => setExpandedPhotos(ticket.deviceConditionFront || null)}
                            >
                              <img
                                src={ticket.deviceConditionFront}
                                alt={t('beforeRepair')}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                <PhotoIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                                {t('beforeRepair')}
                              </span>
                            </div>
                          )}
                          {ticket.deviceConditionBack && (
                            <div
                              className="relative cursor-pointer group"
                              onClick={() => setExpandedPhotos(ticket.deviceConditionBack || null)}
                            >
                              <img
                                src={ticket.deviceConditionBack}
                                alt={t('afterRepair')}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                <PhotoIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                                {t('afterRepair')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            {ticket.statusHistory && ticket.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('statusHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-6">
                      {ticket.statusHistory.map((history, index) => {
                        const isLast = index === ticket.statusHistory.length - 1;
                        const isCurrent = history.status === ticket.status;
                        const statusConfig = getStatusConfig(history.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div key={history.id} className="relative flex gap-4">
                            <div className="relative z-10">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCurrent
                                    ? 'ring-4 ring-offset-2 animate-pulse'
                                    : 'bg-white dark:bg-gray-800 border-2'
                                }`}
                                style={{
                                  backgroundColor: isCurrent ? statusConfig.color : undefined,
                                  borderColor: isCurrent ? statusConfig.color : '#e5e7eb',
                                }}
                              >
                                <StatusIcon
                                  className={`h-4 w-4 ${
                                    isCurrent ? 'text-white' : statusConfig.textColor
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold" style={{ color: statusConfig.color }}>
                                  {t(statusConfig.label)}
                                </h4>
                                {isCurrent && (
                                  <Badge className="text-xs" style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}>
                                    {t('status')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(history.createdAt), 'PPpp')}
                              </p>
                              {history.notes && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{history.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Button
                variant="outlined"
                className="gap-2"
                onClick={() => setIsContactModalOpen(true)}
              >
                <EnvelopeIcon className="h-4 w-4" />
                {t('contactSupport')}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={companyInfo.logo}
                  alt={companyInfo.storeName}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/default-logo.png';
                  }}
                />
                <h3 className="font-semibold text-lg">{companyInfo.storeName}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional Device Repair You Can Trust
              </p>
              {companyInfo.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{companyInfo.address}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('contactSupport')}</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {companyInfo.email && (
                  <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100">
                    <EnvelopeIcon className="h-4 w-4" />
                    {companyInfo.email}
                  </a>
                )}
                {companyInfo.phone && (
                  <a href={`tel:${companyInfo.phone}`} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100">
                    <PhoneIcon className="h-4 w-4" />
                    {companyInfo.phone}
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                {socialMedia.facebook_url && (
                  <a href={socialMedia.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.instagram_url && (
                  <a href={socialMedia.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.youtube_url && (
                  <a href={socialMedia.youtube_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} {companyInfo.storeName}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Photo Lightbox */}
      {expandedPhotos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpandedPhotos(null)}
        >
          <img
            src={expandedPhotos}
            alt="Device condition"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedPhotos(null)}
            className={`absolute top-4 text-white hover:text-gray-300 ${language === 'ar' ? 'left-4' : 'right-4'}`}
            aria-label="Close"
          >
            <XCircleIcon className="h-8 w-8" />
          </button>
        </div>
            )}

            <ContactSupportModal
              open={isContactModalOpen}
              onOpenChange={setIsContactModalOpen}
              customerData={ticket ? {
                name: ticket.customer.name,
                email: ticket.customer.email,
                phone: ticket.customer.phone,
              } : undefined}
            />

            {/* Satisfaction Rating Modal */}
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
