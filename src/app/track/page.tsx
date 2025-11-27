'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import Link from 'next/link';

export default function TrackPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTicket(null);

    try {
      const response = await fetch(`/api/track?code=${trackingCode}`);
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
      </div>
    </div>
  );
}

