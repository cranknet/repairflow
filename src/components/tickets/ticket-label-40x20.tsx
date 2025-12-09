'use client';

import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface TicketLabel40x20Props {
  ticket: any;
}

export function TicketLabel40x20({ ticket }: TicketLabel40x20Props) {
  const [companyName, setCompanyName] = useState<string>('RepairFlow');

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.company_name) {
          setCompanyName(data.company_name);
        }
      })
      .catch(console.error);
  }, []);

  const issueText = ticket.deviceIssue
    ? ticket.deviceIssue.substring(0, 25) + (ticket.deviceIssue.length > 25 ? '...' : '')
    : '';

  return (
    <div
      className="bg-white"
      style={{
        width: '40mm',
        height: '20mm',
        padding: '1.5mm 2mm',
        fontSize: '7px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: '5.5px', fontWeight: 'bold', color: '#000', marginBottom: '0.5mm' }}>
        {companyName.substring(0, 20)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        <div style={{ flex: '1', paddingRight: '1.5mm' }}>
          <div style={{ fontSize: '5px', lineHeight: '1.25', marginBottom: '0.3mm' }}>
            <strong>Customer:</strong> {ticket.customer?.name?.substring(0, 16) || 'N/A'}
          </div>
          <div style={{ fontSize: '5px', lineHeight: '1.25', marginBottom: '0.3mm' }}>
            <strong>Device:</strong> {ticket.deviceBrand?.substring(0, 8) || ''} {ticket.deviceModel?.substring(0, 8) || ''}
          </div>
          <div style={{ fontSize: '5px', lineHeight: '1.25', marginBottom: '0.3mm' }}>
            <strong>Phone:</strong> {ticket.customer?.phone?.substring(0, 12) || 'N/A'}
          </div>
          {issueText && (
            <div style={{ fontSize: '4.5px', lineHeight: '1.2', color: '#333', fontStyle: 'italic' }}>
              Issue: {issueText}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <QRCodeSVG value={ticket.trackingCode || 'N/A'} size={40} level="M" includeMargin={false} />
          <div style={{ fontSize: '4px', marginTop: '0.3mm', textAlign: 'center', fontFamily: 'monospace' }}>
            {ticket.trackingCode || 'N/A'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '4px', color: '#666', textAlign: 'left' }}>
        {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd MMM yyyy') : ''}
      </div>
    </div>
  );
}
