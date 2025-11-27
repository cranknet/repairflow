'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_SMS_TEMPLATES, formatSMSTemplate, fetchSMSTemplates } from '@/lib/sms-templates';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';

interface CompletionSMSPromptProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  customerName: string;
  ticketData: {
    ticketNumber: string;
    trackingCode: string;
    finalPrice?: number;
  };
}

export function CompletionSMSPrompt({
  isOpen,
  onClose,
  phoneNumber,
  customerName,
  ticketData,
}: CompletionSMSPromptProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-select "completed" template and populate message
  useEffect(() => {
    if (isOpen) {
      const loadTemplate = async () => {
        const templates = await fetchSMSTemplates(language);
        const completedTemplate = templates.find(
          (t) => t.id === 'ticket_completed' || t.templateId === 'ticket_completed'
        ) || DEFAULT_SMS_TEMPLATES.find((t) => t.id === 'ticket_completed');
        
        if (completedTemplate) {
          const data: Record<string, string> = {
            customerName: customerName || 'Customer',
            ticketNumber: ticketData.ticketNumber,
            trackingCode: ticketData.trackingCode,
            finalPrice: ticketData.finalPrice?.toFixed(2) || '0.00',
          };
          setMessage(formatSMSTemplate(completedTemplate, data));
        }
      };
      loadTemplate();
      fetchPorts();
    }
  }, [isOpen, customerName, ticketData, language]);

  const fetchPorts = async () => {
    setIsLoadingPorts(true);
    try {
      const response = await fetch('/api/sms/ports');
      if (response.ok) {
        const data = await response.json();
        setPorts(data);
        if (data.length > 0) {
          setSelectedPort(data[0].path);
        }
      }
    } catch (error) {
      console.error('Error fetching ports:', error);
    } finally {
      setIsLoadingPorts(false);
    }
  };

  const handleSendSMS = async () => {
    if (!selectedPort) {
      toast({
        title: 'Warning',
        description: 'No COM port selected. SMS cannot be sent automatically.',
      });
      onClose();
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portPath: selectedPort,
          phoneNumber,
          message,
          templateId: 'ticket_completed',
          language,
          data: {
            customerName,
            ticketNumber: ticketData.ticketNumber,
            trackingCode: ticketData.trackingCode,
            finalPrice: ticketData.finalPrice?.toFixed(2) || '0.00',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS');
      }

      toast({
        title: 'Success',
        description: 'SMS notification sent successfully!',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'SMS Send Failed',
        description: error.message || 'Failed to send SMS. You can try again from the Messaging tab.',
      });
      // Still close the modal even if SMS fails
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Completion Notification</DialogTitle>
          <DialogDescription>
            Notify the customer that their repair is completed and ready for pickup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* COM Port Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">COM Port</label>
            <div className="flex gap-2">
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={isLoadingPorts || isSending}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Select COM port</option>
                {ports.map((port) => (
                  <option key={port.path} value={port.path}>
                    {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                  </option>
                ))}
              </select>
              <Button
                onClick={fetchPorts}
                variant="outline"
                size="icon"
                disabled={isLoadingPorts || isSending}
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoadingPorts ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {ports.length === 0 && !isLoadingPorts && (
              <p className="text-xs text-amber-600 mt-1">
                No COM ports found. SMS cannot be sent automatically.
              </p>
            )}
          </div>

          {/* Message Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-sm whitespace-pre-wrap">{message || 'No message'}</p>
              <p className="text-xs text-gray-500 mt-2">Length: {message.length} characters</p>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium mb-2 block">Recipient</label>
            <p className="text-sm text-gray-600 dark:text-gray-400">{phoneNumber}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} disabled={isSending}>
            Skip
          </Button>
          <Button onClick={handleSendSMS} disabled={isSending || !selectedPort || !message.trim()}>
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

