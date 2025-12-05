'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XMarkIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { SMSSender } from '@/components/sms/sms-sender';
import { format } from 'date-fns';
import Link from 'next/link';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    createdAt: string;
    _count?: {
      tickets: number;
    };
  };
  tickets?: Array<{
    id: string;
    ticketNumber: string;
    status: string;
    deviceBrand: string;
    deviceModel: string;
    createdAt: string;
  }>;
}

export function CustomerProfileModal({ isOpen, onClose, customer, tickets = [] }: CustomerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'contact'>('info');

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-4xl mx-4 max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {customer.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customer Profile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'info'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Ticket History ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'contact'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Contact
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Information Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {customer.address && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                      <p className="font-medium">{customer.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {customer.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                      <p className="text-2xl font-bold">{customer._count?.tickets || tickets.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                      <p className="text-sm font-medium">
                        {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      onClick={onClose}
                    >
                      <Card className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Ticket {ticket.ticketNumber}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {ticket.deviceBrand} {ticket.deviceModel}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    No tickets found for this customer
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <SMSSender
                phoneNumber={customer.phone}
                customerName={customer.name}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/customers/${customer.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Full Profile
            </Button>
          </Link>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

