'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface SatisfactionRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketNumber: string;
  trackingCode: string;
  customerName: string;
  customerEmail: string;
  canSubmitRating: boolean;
  existingRating?: {
    id: string;
    rating: number;
    comment: string | null;
    phoneNumber: string | null;
    verifiedBy: string;
    createdAt: string;
  } | null;
}

type VerificationState = 'locked' | 'verified';

export function SatisfactionRatingModal({
  open,
  onOpenChange,
  ticketId,
  ticketNumber,
  trackingCode,
  customerName,
  customerEmail,
  canSubmitRating,
  existingRating,
}: SatisfactionRatingModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [verificationState, setVerificationState] = useState<VerificationState>(
    canSubmitRating ? 'verified' : 'locked'
  );
  const [name, setName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already submitted, show message
  if (existingRating) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('satisfaction.rating_label')}</DialogTitle>
            <DialogDescription>Your review has been submitted</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('satisfaction.rating_label')}</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-6 w-6 ${
                      star <= existingRating.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {existingRating.comment && (
              <div>
                <Label>{t('satisfaction.comment_label')}</Label>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {existingRating.comment}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Submitted on {new Date(existingRating.createdAt).toLocaleDateString()}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If not eligible to submit (ticket not completed/repaired)
  if (!canSubmitRating) {
    return null;
  }

  const handleVerifyName = async () => {
    if (!name.trim()) {
      toast({
        title: t('error'),
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/verify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      toast({
        title: t('success'),
        description: t('satisfaction.verified_success'),
      });
      setVerificationState('verified');
    } catch (error) {
      toast({
        title: t('error'),
        description: t('satisfaction.error.not_customer'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: t('error'),
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    // If rating is low (1-2 stars), require phone number
    if (rating <= 2 && !phoneNumber.trim()) {
      toast({
        title: t('error'),
        description: t('satisfaction.phone_required'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = new URL(`/api/tickets/${ticketId}/satisfaction`, window.location.origin);
      url.searchParams.set('ticket', ticketNumber);
      url.searchParams.set('code', trackingCode);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          name: verificationState === 'verified' ? name.trim() : customerName,
          email: customerEmail,
          token: trackingCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      toast({
        title: t('success'),
        description: t('satisfaction.success'),
      });
      onOpenChange(false);
      // Reload page to show the submitted rating
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to submit rating';
      toast({
        title: t('error'),
        description: t(errorMessage) || errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('satisfaction.rating_label')}</DialogTitle>
          <DialogDescription>
            {verificationState === 'locked'
              ? t('satisfaction.locked_message')
              : 'Share your experience with us'}
          </DialogDescription>
        </DialogHeader>

        {verificationState === 'locked' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('satisfaction.locked_message')}
            </p>
            <div className="space-y-2">
              <Label htmlFor="verify-name">{t('name')}</Label>
              <div className="flex gap-2">
                <Input
                  id="verify-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('name')}
                  disabled={isVerifying}
                  className="flex-1"
                />
                <Button
                  onClick={handleVerifyName}
                  disabled={isVerifying || !name.trim()}
                >
                  {isVerifying ? t('loading') : t('satisfaction.verify_cta')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {verificationState === 'verified' && (
          <div className="space-y-4">
            <div>
              <Label>{t('satisfaction.rating_label')}</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                    disabled={isSubmitting}
                  >
                    {star <= (hoveredRating || rating) ? (
                      <StarIcon className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarOutlineIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Low Rating Follow-up */}
            {rating > 0 && rating <= 2 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t('satisfaction.low_rating_greeting')}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  {t('satisfaction.low_rating_message')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="satisfaction-phone">{t('satisfaction.phone_label')}</Label>
                  <Input
                    id="satisfaction-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('satisfaction.phone_placeholder')}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="satisfaction-comment">{t('satisfaction.comment_label')}</Label>
              <Textarea
                id="satisfaction-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('satisfaction.comment_label')}
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? t('loading') : t('satisfaction.submit_button')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

