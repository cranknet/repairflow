'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_SMS_TEMPLATES, formatSMSTemplate, fetchSMSTemplates, SMSTemplate } from '@/lib/sms-templates';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { isMobile } from '@/lib/platform';
import { useLanguage } from '@/contexts/language-context';

interface SMSSenderProps {
  phoneNumber: string;
  customerName?: string;
  ticketData?: {
    ticketNumber: string;
    trackingCode: string;
    finalPrice?: number;
  };
}

export function SMSSender({ phoneNumber, customerName, ticketData }: SMSSenderProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [preview, setPreview] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>(DEFAULT_SMS_TEMPLATES);

  useEffect(() => {
    // Only fetch COM ports on web platform
    if (!isMobile()) {
      fetchPorts();
    }
    // Fetch templates for current language
    fetchSMSTemplates(language).then(setTemplates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, customMessage, customerName, ticketData]);

  const fetchPorts = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/sms/ports');
      if (response.ok) {
        const data = await response.json();
        setPorts(data);
        if (data.length > 0 && !selectedPort) {
          setSelectedPort(data[0].path);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch COM ports',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch COM ports',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const updatePreview = () => {
    if (selectedTemplate && selectedTemplate !== 'custom') {
      const template = templates.find((t) => t.id === selectedTemplate || t.templateId === selectedTemplate);
      if (template) {
        const data: Record<string, string> = {
          customerName: customerName || 'Customer',
          ticketNumber: ticketData?.ticketNumber || 'TKT-000000',
          trackingCode: ticketData?.trackingCode || 'TRACK123',
          finalPrice: ticketData?.finalPrice?.toFixed(2) || '0.00',
        };
        setPreview(formatSMSTemplate(template, data));
      }
    } else {
      setPreview(customMessage);
    }
  };

  const handleSend = async () => {
    // Skip COM port check on mobile
    if (!isMobile() && !selectedPort) {
      toast({
        title: 'Error',
        description: 'Please select a COM port',
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Phone number is required',
      });
      return;
    }

    const message = selectedTemplate === 'custom' ? customMessage : preview;
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portPath: selectedPort,
          phoneNumber,
          templateId: selectedTemplate || undefined,
          message: selectedTemplate === 'custom' ? customMessage : preview,
          language,
          data: {
            customerName: customerName || 'Customer',
            ticketNumber: ticketData?.ticketNumber || '',
            trackingCode: ticketData?.trackingCode || '',
            finalPrice: ticketData?.finalPrice?.toFixed(2) || '0.00',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS');
      }

      toast({
        title: 'Success',
        description: 'SMS sent successfully',
      });

      // Reset form
      setSelectedTemplate('');
      setCustomMessage('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Hide COM port features on mobile (not supported)
  const showCOMPortFeatures = !isMobile();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Send SMS</CardTitle>
            <CardDescription>
              {isMobile() 
                ? 'SMS via native Android API (coming soon)' 
                : 'Send SMS via COM port (AT commands)'}
            </CardDescription>
          </div>
          {showCOMPortFeatures && (
            <Button
              onClick={fetchPorts}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Ports
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* COM Port Selection - Only show on web */}
        {showCOMPortFeatures && (
          <div>
            <Label htmlFor="com-port">COM Port *</Label>
            <select
              id="com-port"
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
            >
              <option value="">Select COM port</option>
              {ports.map((port) => (
                <option key={port.path} value={port.path}>
                  {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                </option>
              ))}
            </select>
            {ports.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No COM ports found. Click &quot;Refresh Ports&quot; to scan.</p>
            )}
          </div>
        )}

        {isMobile() && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              COM port SMS is not available on mobile devices. Native Android SMS integration coming soon.
            </p>
          </div>
        )}

        {/* Phone Number */}
        <div>
          <Label htmlFor="phone-number">Phone Number *</Label>
          <Input
            id="phone-number"
            value={phoneNumber}
            readOnly
            className="mt-1 bg-gray-50 dark:bg-gray-800"
          />
        </div>

        {/* Template Selection */}
        <div>
          <Label htmlFor="template">Message Template</Label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
          >
            <option value="">Select a template</option>
            {templates
              .filter((t) => t.isActive !== false)
              .map((template) => (
                <option key={template.id} value={template.id || template.templateId}>
                  {template.name} {template.language && template.language !== language ? `(${template.language})` : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Custom Message (if custom template selected) */}
        {selectedTemplate === 'custom' && (
          <div>
            <Label htmlFor="custom-message">Custom Message *</Label>
            <textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
              placeholder="Enter your custom message..."
            />
          </div>
        )}

        {/* Message Preview */}
        {(selectedTemplate || customMessage) && (
          <div>
            <Label>Message Preview</Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-sm whitespace-pre-wrap">{preview || 'No preview available'}</p>
              <p className="text-xs text-gray-500 mt-2">Length: {preview.length} characters</p>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isLoading || (showCOMPortFeatures && !selectedPort) || !phoneNumber || (!selectedTemplate && !customMessage)}
          className="w-full"
        >
          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
          {isLoading ? 'Sending...' : isMobile() ? 'Send SMS (Not Available)' : 'Send SMS'}
        </Button>
      </CardContent>
    </Card>
  );
}

