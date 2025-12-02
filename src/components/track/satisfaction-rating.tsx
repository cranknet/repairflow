'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface SatisfactionRatingProps {
  ticketId: string;
  ticketNumber: string;
  trackingCode: string;
  customerEmail: string;
  canSubmitRating: boolean;
  existingRating?: {
    id: string;
    rating: number;
    comment: string | null;
    verifiedBy: string;
    createdAt: string;
  } | null;
}

type VerificationState = 'locked' | 'verifying' | 'verified' | 'submitted';

export function SatisfactionRating({
  ticketId,
  ticketNumber,
  trackingCode,
  customerEmail,
  canSubmitRating,
  existingRating,
}: SatisfactionRatingProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [verificationState, setVerificationState] = useState<VerificationState>(
    existingRating ? 'submitted' : canSubmitRating ? 'verified' : 'locked'
  );
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already submitted, show the existing rating
  if (existingRating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('satisfaction.rating_label')}</CardTitle>
          <CardDescription>Your review has been submitted</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    );
  }

  // If not eligible to submit (ticket not completed/repaired)
  if (!canSubmitRating) {
    return null;
  }

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      toast({
        title: t('error'),
        description: t('satisfaction.verify_email_placeholder'),
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/verify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
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
          email: verificationState === 'verified' ? email.trim() : customerEmail,
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
      setVerificationState('submitted');
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
    <Card>
      <CardHeader>
        <CardTitle>{t('satisfaction.rating_label')}</CardTitle>
        <CardDescription>
          {verificationState === 'locked'
            ? t('satisfaction.locked_message')
            : 'Share your experience with us'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verificationState === 'locked' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('satisfaction.locked_message')}
            </p>
            <div className="space-y-2">
              <Label htmlFor="verify-email">{t('satisfaction.verify_email_placeholder')}</Label>
              <div className="flex gap-2">
                <Input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('satisfaction.verify_email_placeholder')}
                  disabled={isVerifying}
                  className="flex-1"
                />
                <Button
                  onClick={handleVerifyEmail}
                  disabled={isVerifying || !email.trim()}
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

            <Button
              onClick={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
              className="w-full"
            >
              {isSubmitting ? t('loading') : t('satisfaction.submit_button')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

