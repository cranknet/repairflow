# Printing Subsystem Guide

## Overview

RepairFlow supports various printing capabilities for tickets, labels, and receipts.

## Features

- **Ticket Printing**: Full repair ticket with customer and device details
- **Label Printing**: Thermal labels with QR codes
- **Receipt Printing**: Payment receipts

## Configuration

### Feature Flag

Enable/disable via environment variable:
```bash
FEATURE_PRINTING=true  # or false to disable
```

### Usage in Code

```typescript
import { isPrintingEnabled } from '@/lib/feature-flags';

if (isPrintingEnabled()) {
  // Show print buttons
}
```

## Printer Setup

### Browser Printing

1. Click print button on ticket
2. Browser print dialog opens
3. Select printer and print

### Thermal Label Printers

Supported printers:
- Zebra (via browser print)
- Brother QL series
- DYMO LabelWriter

Configuration:
1. Install printer drivers
2. Set paper size to label dimensions
3. Configure margins for your label stock

### Serial Port Printers (Advanced)

For direct serial port printing (POS printers):
```bash
# Requires Node.js native modules
npm install serialport @serialport/parser-readline
```

**Note**: Serial port features require running outside browser context.

## Print Templates

Templates are generated using `@react-pdf/renderer`:

### Ticket Template
- Customer information
- Device details
- Work description
- Pricing
- Terms & conditions
- QR code for tracking

### Label Template
- Ticket number
- Customer name
- Device info
- QR code

## Customization

### Logo

1. Go to Settings → Branding
2. Upload your logo
3. Logo appears on printed tickets

### Terms & Conditions

1. Go to Settings → Tickets
2. Edit terms & conditions text
3. Text appears on ticket footer

## Troubleshooting

### Print Not Working

1. Check `FEATURE_PRINTING=true` in environment
2. Verify browser allows popups (for print dialog)
3. Check printer is online

### PDF Generation Failed

1. Check browser console for errors
2. Ensure fonts are loading (CDN access)
3. Try refreshing and printing again

### Label Size Wrong

1. Check printer paper size settings
2. Adjust in printer preferences
3. Some browsers override page size - check print preview
