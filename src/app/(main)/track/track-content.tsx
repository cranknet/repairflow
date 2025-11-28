'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import Link from 'next/link';

export function TrackContent() {
  const searchParams = useSearchParams();
  const [trackingCode, setTrackingCode] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialMedia, setSocialMedia] = useState({
    facebook_url: '',
    youtube_url: '',
    instagram_url: '',
  });

  useEffect(() => {
    // Fetch social media URLs from settings
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        setSocialMedia({
          facebook_url: data.facebook_url || '',
          youtube_url: data.youtube_url || '',
          instagram_url: data.instagram_url || '',
        });
      })
      .catch(console.error);
  }, []);

  // Define handleTrackByCode before using it in useEffect
  const handleTrackByCode = async (code: string) => {
    setIsLoading(true);
    setError('');
    setTicket(null);

    try {
      const response = await fetch(`/api/track?code=${code}`);
      if (!response.ok) {
        throw new Error('Ticket not found');
      }
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      setError('Ticket not found. Please check your tracking code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Read tracking code from URL and auto-fetch
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setTrackingCode(codeFromUrl.toUpperCase());
      // Automatically fetch ticket
      handleTrackByCode(codeFromUrl.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      handleTrackByCode(trackingCode.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'WAITING_FOR_PARTS':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">RepairFlow</h1>
          <p className="text-gray-600 dark:text-gray-400">Track Your Repair</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Track Your Ticket</CardTitle>
            <CardDescription>Enter your tracking code to check the status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trackingCode">Tracking Code</Label>
                <Input
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Enter tracking code"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Tracking...' : 'Track'}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                {error}
              </div>
            )}

            {ticket && (
              <div className="mt-6 space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Ticket Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ticket Number:</span>
                      <span className="font-medium">{ticket.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Device:</span>
                      <span className="font-medium">
                        {ticket.deviceBrand} {ticket.deviceModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Issue:</span>
                      <span className="font-medium">{ticket.deviceIssue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="font-medium">
                        {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {ticket.finalPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Final Price:</span>
                        <span className="font-medium">${ticket.finalPrice.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {ticket.statusHistory && ticket.statusHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Status History</h3>
                    <div className="space-y-2">
                      {(ticket.statusHistory || []).map((history: any) => (
                        <div key={history.id} className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{history.status.replace('_', ' ')}</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {format(new Date(history.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                              {history.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Links */}
        {(socialMedia.facebook_url || socialMedia.youtube_url || socialMedia.instagram_url) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4">
                {socialMedia.facebook_url && (
                  <a
                    href={socialMedia.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.youtube_url && (
                  <a
                    href={socialMedia.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 transition-colors"
                    aria-label="YouTube"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.instagram_url && (
                  <a
                    href={socialMedia.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

