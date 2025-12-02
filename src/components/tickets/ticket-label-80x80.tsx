'use client';

import { QRCodeSVG } from 'qrcode.react';
import { format, addDays } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';

interface TicketLabel80x80Props {
  ticket: any;
}

export function TicketLabel80x80({ ticket }: TicketLabel80x80Props) {
  const { t } = useLanguage();
  const [companyName, setCompanyName] = useState<string>('RepairFlow');
  const [companyPhone, setCompanyPhone] = useState<string>('');

  // Use useMemo to derive trackUrl instead of storing in state
  const trackUrl = useMemo(() => {
    if (typeof window !== 'undefined' && ticket.trackingCode) {
      const baseUrl = window.location.origin;
      return `${baseUrl}/track?code=${ticket.trackingCode}`;
    }
    return '';
  }, [ticket.trackingCode]);

  useEffect(() => {
    // Fetch company name and phone from settings
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.company_name) {
          setCompanyName(data.company_name);
        }
        if (data.company_phone) {
          setCompanyPhone(data.company_phone);
        }
      })
      .catch(console.error);
  }, []); // Only fetch once on mount

  return (
    <div
      className="bg-white"
      style={{
        width: '80mm',
        height: '120mm',
        padding: '4mm',
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '1mm' }}>{companyName}</div>
        {companyPhone && (
          <div style={{ fontSize: '9px', color: '#666', marginBottom: '1mm' }}>{companyPhone}</div>
        )}
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>{ticket.ticketNumber || 'N/A'}</div>
      </div>

      {/* Customer Section */}
      <div style={{ marginBottom: '2mm', paddingBottom: '2mm', borderBottom: '1px solid #ddd' }}>
        <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '1mm' }}>CUSTOMER INFORMATION</div>
        <div style={{ fontSize: '8px', lineHeight: '1.4' }}>
          <div><strong>Name:</strong> {ticket.customer?.name || 'N/A'}</div>
          <div><strong>Phone:</strong> {ticket.customer?.phone || 'N/A'}</div>
          {ticket.customer?.email && (
            <div><strong>Email:</strong> {ticket.customer.email}</div>
          )}
        </div>
      </div>

      {/* Device Section */}
      <div style={{ marginBottom: '2mm', paddingBottom: '2mm', borderBottom: '1px solid #ddd' }}>
        <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '1mm' }}>DEVICE INFORMATION</div>
        <div style={{ fontSize: '8px', lineHeight: '1.4' }}>
          <div><strong>Brand:</strong> {ticket.deviceBrand || 'N/A'}</div>
          <div><strong>Model:</strong> {ticket.deviceModel || 'N/A'}</div>
          <div><strong>Issue:</strong> {ticket.deviceIssue ? (ticket.deviceIssue.length > 50 ? ticket.deviceIssue.substring(0, 50) + '...' : ticket.deviceIssue) : 'N/A'}</div>
          <div><strong>Status:</strong> {ticket.status ? ticket.status.replace('_', ' ') : 'N/A'}</div>
        </div>
      </div>

      {/* Pricing Section */}
      <div style={{ marginBottom: '2mm', paddingBottom: '2mm', borderBottom: '1px solid #ddd' }}>
        <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '1mm' }}>PRICING</div>
        <div style={{ fontSize: '8px', lineHeight: '1.4' }}>
          <div><strong>Estimated Price:</strong> ${ticket.estimatedPrice ? ticket.estimatedPrice.toFixed(2) : '0.00'}</div>
          {ticket.finalPrice && (
            <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '1mm' }}>
              <strong>Final Price:</strong> ${ticket.finalPrice.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Section */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '3mm',
        borderTop: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2mm'
      }}>
        {/* Tracking Code as Link */}
        {trackUrl ? (
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '7px',
              fontFamily: 'monospace',
              marginBottom: '1mm',
              color: '#0066cc',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {ticket.trackingCode || 'N/A'}
          </a>
        ) : (
          <div style={{ fontSize: '7px', fontFamily: 'monospace', marginBottom: '1mm' }}>
            {ticket.trackingCode || 'N/A'}
          </div>
        )}
        <QRCodeSVG
          value={trackUrl || ticket.trackingCode || 'N/A'}
          size={80}
          level="M"
          includeMargin={false}
        />

        {/* Warranty Information */}
        {(ticket.warrantyDays || ticket.warrantyText) && (
          <div style={{
            marginTop: '2mm',
            paddingTop: '2mm',
            borderTop: '1px solid #eee',
            textAlign: 'center',
            fontSize: '7px',
            lineHeight: '1.4',
            color: '#333',
            width: '100%',
            maxWidth: '100%',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '1.5mm', fontSize: '8px', color: '#000' }}>
              {t('warrantyInfo')}
            </div>
            {ticket.warrantyDays && (
              <div style={{ marginBottom: '0.8mm', fontWeight: '500' }}>
                {ticket.warrantyDays} {ticket.warrantyDays === 1 ? t('day') : t('days')} {t('warranty')}
              </div>
            )}
            {ticket.warrantyText && (
              <div style={{
                fontStyle: 'italic',
                marginTop: ticket.warrantyDays ? '0.8mm' : '0',
                fontSize: '6.5px',
                padding: '0 1mm',
                wordWrap: 'break-word',
              }}>
                {ticket.warrantyText}
              </div>
            )}
            {ticket.warrantyDays && ticket.completedAt && (
              <div style={{ marginTop: '1.2mm', fontSize: '6px', color: '#666', fontWeight: '500' }}>
                {t('validUntil')}: {format(addDays(new Date(ticket.completedAt), ticket.warrantyDays), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Created Date - Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: '4mm',
        left: '4mm',
        fontSize: '6px',
        color: '#666'
      }}>
        {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
      </div>
    </div>
  );
}

