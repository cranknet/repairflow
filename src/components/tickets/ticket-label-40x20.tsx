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
    // Fetch company name from settings
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.company_name) {
          setCompanyName(data.company_name);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div
      className="bg-white"
      style={{
        width: '40mm',
        height: '20mm',
        padding: '2mm',
        fontSize: '7px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
        <div style={{ 
          position: 'absolute', 
          top: '2mm', 
          left: '2mm', 
          fontSize: '6px', 
          fontWeight: 'bold',
          color: '#000' 
        }}>
          {companyName.substring(0, 20)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%', marginTop: '3mm' }}>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', paddingRight: '2mm' }}>
            <div>
              <div style={{ fontSize: '6px', lineHeight: '1.2', marginBottom: '0.5mm' }}>
                <strong>Customer:</strong> {ticket.customer?.name ? ticket.customer.name.substring(0, 20) : 'N/A'}
              </div>
              <div style={{ fontSize: '6px', lineHeight: '1.2', marginBottom: '0.5mm' }}>
                <strong>Device:</strong> {ticket.deviceBrand ? ticket.deviceBrand.substring(0, 8) : 'N/A'} {ticket.deviceModel ? ticket.deviceModel.substring(0, 10) : 'N/A'}
              </div>
              <div style={{ fontSize: '6px', lineHeight: '1.2', marginBottom: '0.5mm' }}>
                <strong>Phone:</strong> {ticket.customer?.phone ? ticket.customer.phone.substring(0, 15) : 'N/A'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeSVG
              value={ticket.trackingCode || 'N/A'}
              size={45}
              level="M"
              includeMargin={false}
            />
            <div style={{ fontSize: '5px', marginTop: '1mm', textAlign: 'center' }}>
              {ticket.trackingCode || 'N/A'}
            </div>
          </div>
        </div>
        <div style={{ 
          position: 'absolute', 
          bottom: '2mm', 
          left: '2mm', 
          fontSize: '5px', 
          color: '#666' 
        }}>
          {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM dd, yyyy') : 'N/A'}
        </div>
    </div>
  );
}

