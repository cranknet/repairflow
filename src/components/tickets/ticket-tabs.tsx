'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { DevicePhotos } from './device-photos';
import { PriceAdjustment } from './price-adjustment';
import { TicketAssignment } from './ticket-assignment';
import { ReturnHandler } from './return-handler';
import { SMSSender } from '@/components/sms/sms-sender';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';

// Type definitions
interface PriceAdjustmentUser {
  name: string | null;
  username: string;
}

interface PriceAdjustmentEntry {
  id: string;
  ticketId: string;
  userId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  createdAt: Date | string;
  user: PriceAdjustmentUser;
}

interface StatusHistoryEntry {
  id: string;
  ticketId: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
}

interface TicketPart {
  id: string;
  quantity: number;
  part: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
}

interface TicketCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  trackingCode: string;
  deviceBrand: string;
  deviceModel: string;
  deviceIssue: string;
  deviceConditionFront: string | null;
  deviceConditionBack: string | null;
  estimatedPrice: number;
  finalPrice: number | null;
  paid: boolean;
  notes: string | null;
  customer: TicketCustomer;
  assignedTo: { id: string; name: string | null; username: string } | null;
  statusHistory: StatusHistoryEntry[];
  parts: TicketPart[];
  priceAdjustments: PriceAdjustmentEntry[];
}

interface TicketTabsProps {
  ticket: Ticket;
  userRole: string;
}

export function TicketTabs({ ticket, userRole }: TicketTabsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const TABS = [
    { id: 'overview', label: t('overview') },
    { id: 'status', label: t('ticketStatusHistory') },
    { id: 'parts', label: t('partsReturns') },
    { id: 'pricing', label: t('pricing') },
    { id: 'messaging', label: t('messaging') },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'WAITING_FOR_PARTS':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'REPAIRED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'RETURNED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleCopyTrackingCode = async () => {
    if (!ticket.trackingCode) return;

    try {
      await navigator.clipboard.writeText(ticket.trackingCode);
      setCopied(true);
      toast({
        title: t('success'),
        description: 'Tracking code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: t('error'),
        description: 'Failed to copy tracking code',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 sm:py-4 px-4 sm:px-1 border-l-4 sm:border-l-0 sm:border-b-2 font-medium text-sm transition-colors text-left sm:text-center
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50 sm:bg-transparent dark:text-primary-400 dark:bg-primary-900/20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 sm:hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 sm:dark:hover:bg-transparent'
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('status')}</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('priority')}</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {ticket.priority}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('trackingCode')}</p>
                  <button
                    onClick={handleCopyTrackingCode}
                    className="font-mono text-sm font-medium cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors select-all"
                    title="Click to copy"
                  >
                    {ticket.trackingCode}
                  </button>
                  {copied && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">Copied!</span>
                  )}
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
                <CardTitle>{t('deviceInformation')}</CardTitle>
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

            {/* Parts Used */}
            {ticket.parts && ticket.parts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('partsUsed')}</CardTitle>
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
            )}

            {/* Notes */}
            {ticket.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('notes')}</CardTitle>
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
              <CardTitle>{t('ticketStatusHistory')}</CardTitle>
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

        {/* Parts Used - Now in Overview Tab */}
        {activeTab === 'overview' && ticket.parts && ticket.parts.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('partsUsed')}</CardTitle>
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
        )}

        {/* Parts & Returns Tab */}
        {activeTab === 'parts' && (
          <div className="space-y-6">
            {/* Parts Used with Inventory Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="material-symbols-outlined">inventory_2</span>
                    {t('partsUsed')}
                  </CardTitle>
                  {ticket.parts && ticket.parts.length > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ticket.parts.length} {ticket.parts.length === 1 ? t('part') || 'part' : t('parts')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(!ticket.parts || ticket.parts.length === 0) ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">inventory</span>
                    <p>{t('noPartsUsed')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticket.parts.map((ticketPart: any) => {
                      const stockStatus = ticketPart.part.quantity <= 0
                        ? 'outOfStock'
                        : ticketPart.part.quantity <= 5
                          ? 'lowStock'
                          : 'inStock';

                      const stockColors: Record<string, string> = {
                        inStock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                        lowStock: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                        outOfStock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      };

                      return (
                        <div
                          key={ticketPart.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{ticketPart.part.name}</p>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${stockColors[stockStatus]}`}>
                                {t(stockStatus)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-mono">{ticketPart.part.sku}</span>
                              <span>•</span>
                              <span>{t('currentStock') || 'Stock'}: {ticketPart.part.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{ticketPart.quantity}x</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${(ticketPart.part.unitPrice * ticketPart.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Parts Total */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-medium">{t('total')}:</span>
                      <span className="font-bold text-lg">
                        ${ticket.parts.reduce((sum: number, tp: any) => sum + (tp.part.unitPrice * tp.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Returns Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-symbols-outlined">undo</span>
                  {t('returns')}
                </CardTitle>
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
                <CardTitle>{t('pricingInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('estimatedPrice')}</p>
                    <p className="text-2xl font-bold">${ticket.estimatedPrice.toFixed(2)}</p>
                  </div>
                  {ticket.finalPrice !== null && (
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('finalPrice')}</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ${ticket.finalPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">{t('paymentStatus')}</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${ticket.paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                      {ticket.paid ? t('paid') : t('unpaid')}
                    </span>
                  </div>
                </div>

                <PriceAdjustment ticket={ticket} userRole={userRole} />

                {ticket.priceAdjustments && ticket.priceAdjustments.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium">{t('priceAdjustmentHistory')}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.priceAdjustments.length} {ticket.priceAdjustments.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(ticket.priceAdjustments || []).map((adjustment: PriceAdjustmentEntry, index: number) => {
                        const priceDiff = adjustment.newPrice - adjustment.oldPrice;
                        const isIncrease = priceDiff > 0;
                        const isDecrease = priceDiff < 0;
                        const isInitialSetting = adjustment.reason.toLowerCase().includes('initial');

                        return (
                          <div
                            key={adjustment.id}
                            className={`p-4 rounded-lg border transition-colors ${isInitialSetting
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {/* Price change indicator */}
                                <div className={`flex items-center gap-1 font-semibold ${isIncrease ? 'text-red-600 dark:text-red-400'
                                  : isDecrease ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                                    ${adjustment.oldPrice.toFixed(2)}
                                  </span>
                                  <span className="mx-1">→</span>
                                  <span>${adjustment.newPrice.toFixed(2)}</span>
                                </div>
                                {/* Price change badge */}
                                {priceDiff !== 0 && (
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isIncrease
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    }`}>
                                    {isIncrease ? '+' : ''}{priceDiff.toFixed(2)}
                                  </span>
                                )}
                                {/* Initial setting badge */}
                                {isInitialSetting && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {t('initial') || 'Initial'}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(new Date(adjustment.createdAt), 'MMM dd, yyyy')}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {format(new Date(adjustment.createdAt), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 bg-white dark:bg-gray-900/50 p-2 rounded">
                              {adjustment.reason}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium">
                                  {(adjustment.user.name || adjustment.user.username).charAt(0).toUpperCase()}
                                </span>
                                {adjustment.user.name || adjustment.user.username}
                              </p>
                              {index === 0 && ticket.priceAdjustments.length > 1 && (
                                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                  {t('latestAdjustment') || 'Latest'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
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

