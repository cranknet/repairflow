'use client';

import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

interface TicketLabel80x80Props {
  ticket: any;
}

export function TicketLabel80x80({ ticket }: TicketLabel80x80Props) {
  return (
    <div
      className="bg-white"
      style={{
        width: '80mm',
        height: '80mm',
        padding: '4mm',
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '1mm' }}>REPAIR INVOICE</div>
          <div style={{ fontSize: '11px', fontWeight: '600' }}>{ticket.ticketNumber || 'N/A'}</div>
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
            <div style={{ fontSize: '7px', color: '#666', marginTop: '1mm' }}>
              Created: {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '2mm', 
          borderTop: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '8px', fontWeight: '600', marginBottom: '1mm' }}>TRACKING CODE</div>
          <div style={{ fontSize: '7px', fontFamily: 'monospace', marginBottom: '1mm' }}>{ticket.trackingCode || 'N/A'}</div>
          <QRCodeSVG
            value={ticket.trackingCode || 'N/A'}
            size={60}
            level="M"
            includeMargin={false}
          />
        </div>
    </div>
  );
}

