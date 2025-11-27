'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { DevicePhotos } from './device-photos';
import { ReturnHandler } from './return-handler';
import { PriceAdjustment } from './price-adjustment';
import { TicketAssignment } from './ticket-assignment';
import { SMSSender } from '@/components/sms/sms-sender';

interface TicketTabsProps {
  ticket: any;
  userRole: string;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'status', label: 'Status & History' },
  { id: 'parts', label: 'Parts & Returns' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'messaging', label: 'Messaging' },
];

export function TicketTabs({ ticket, userRole }: TicketTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'WAITING_FOR_PARTS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'REPAIRED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Priority</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {ticket.priority}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tracking Code</p>
                  <p className="font-mono text-sm font-medium">{ticket.trackingCode}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TicketAssignment ticket={ticket} userRole={userRole} />
                </CardContent>
              </Card>
            </div>

            {/* Device Details */}
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Brand</p>
                    <p className="font-medium">{ticket.deviceBrand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Model</p>
                    <p className="font-medium">{ticket.deviceModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Issue</p>
                    <p className="font-medium">{ticket.deviceIssue}</p>
                  </div>
                </div>

                {/* Device Photos */}
                <DevicePhotos
                  frontImage={ticket.deviceConditionFront}
                  backImage={ticket.deviceConditionBack}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            {ticket.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{ticket.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Status & History Tab */}
        {activeTab === 'status' && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(ticket.statusHistory || []).map((history: any, index: number) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-600" />
                      {index < ticket.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 min-h-[40px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{history.status.replace('_', ' ')}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(history.status)}`}>
                          {history.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(history.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {history.notes && (
                        <p className="text-sm text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {history.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parts & Returns Tab */}
        {activeTab === 'parts' && (
          <div className="space-y-6">
            {/* Parts Used */}
            {ticket.parts && ticket.parts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Parts Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ticket.parts.map((ticketPart: any) => (
                      <div
                        key={ticketPart.id}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{ticketPart.part.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            SKU: {ticketPart.part.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {ticketPart.quantity}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${(ticketPart.part.unitPrice * ticketPart.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 text-center">No parts used in this repair</p>
                </CardContent>
              </Card>
            )}

            {/* Returns */}
            <Card>
              <CardHeader>
                <CardTitle>Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <ReturnHandler ticket={ticket} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Price</p>
                    <p className="text-2xl font-bold">${ticket.estimatedPrice.toFixed(2)}</p>
                  </div>
                  {ticket.finalPrice !== null && (
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Final Price</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ${ticket.finalPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">Payment Status</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${ticket.paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                      {ticket.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                <PriceAdjustment ticket={ticket} userRole={userRole} />

                {ticket.priceAdjustments && ticket.priceAdjustments.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium mb-3">Price Adjustment History</p>
                    <div className="space-y-3">
                      {(ticket.priceAdjustments || []).map((adjustment: any) => (
                        <div
                          key={adjustment.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">
                              ${adjustment.oldPrice.toFixed(2)} → ${adjustment.newPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(adjustment.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {adjustment.reason}
                          </p>
                          <p className="text-xs text-gray-500">
                            by {adjustment.user.name || adjustment.user.username}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messaging Tab */}
        {activeTab === 'messaging' && (
          <div className="space-y-6">
            <SMSSender
              phoneNumber={ticket.customer.phone}
              customerName={ticket.customer.name}
              ticketData={{
                ticketNumber: ticket.ticketNumber,
                trackingCode: ticket.trackingCode,
                finalPrice: ticket.finalPrice || undefined,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

