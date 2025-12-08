# Price Adjustment Payment Tracking System

## Overview
This system automatically creates adjustment payment records when ticket prices are changed after payment has been made, ensuring a complete audit trail for financial compliance.

## How It Works

### 1. Database Schema Changes

**Payment Model** (`prisma/schema.prisma`)
- Added `isAdjustment` (Boolean) - Flags this as an adjustment payment
- Added `adjustmentType` (String) - Type: "PRICE_INCREASE", "PRICE_DECREASE", or "CORRECTION"
- Added `originalPaymentId` (String) - Links to the original payment being adjusted
- Added `priceAdjustmentId` (String) - Links to the TicketPriceAdjustment record

**TicketPriceAdjustment Model**
- Added `adjustmentPayments` relation to link to automatically created payments

### 2. Automatic Adjustment Payment Creation

**When:** A ticket price is adjusted AFTER payment has been made

**Location:** `src/app/api/tickets/[id]/route.ts` (PATCH handler)

**Logic:**
1. Check if ticket has existing payments (totalPaid > 0)
2. Check if this is a price change (not initial price setting)
3. If both conditions are true, create an adjustment payment:
   - **Amount**: `newPrice - oldPrice` (can be positive or negative)
   - **Type**: AUTO-DETERMINED
     - Positive difference → "PRICE_INCREASE" (customer owes more)
     - Negative difference → "PRICE_DECREASE" (customer gets credit/refund)
   - **Method**: Inherits from the original payment
   - **Reason**: Auto-prefixed with "Price Adjustment: " + reason
   - **Metadata**: Stores oldPrice, newPrice, priceDifference, auto-created flag

### 3. Payment Record Example

```json
{
  "paymentNumber": "PAY-20241207-0003",
  "ticketId": "ticket123",
  "amount": 25.00,  // Can be negative for decreases
  "method": "CASH",
  "performedBy": "user123",
  "reason": "Price Adjustment: Added extra part - screen protector",
  "isAdjustment": true,
  "adjustmentType": "PRICE_INCREASE",
  "originalPaymentId": "payment123",
  "metadata": {
    "autoCreated": true,
    "oldPrice": 100.00,
    "newPrice": 125.00,
    "priceDifference": 25.00
  }
}
```

### 4. Business Rules

1. **Price Adjustments Only After Repair**: Can only adjust when status is REPAIRED or COMPLETED
2. **Reason Required**: Must provide a reason for price adjustments (not initial price setting)
3. **Adjustment Payments Auto-Created**: Only if ticket has existing payments
4. **Audit Trail Preserved**: Original payments are NEVER modified
5. **Payment Status Updated**: If price decreases, ticket is marked as not fully paid

### 5. Special Scenarios

**Scenario 1: Price Increase (Customer Owes More)**
- Original Price: $100, Paid: $100
- Adjusted to: $150
- Result: Creates +$50 adjustment payment, ticket marked as not fully paid

**Scenario 2: Price Decrease (Customer Gets Credit)**
- Original Price: $100, Paid: $100
- Adjusted to: $75
- Result: Creates -$25 adjustment payment, ticket marked as not fully paid

**Scenario 3: Multiple Adjustments**
- Each adjustment creates a new payment record
- All linked through `originalPaymentId` for tracking

**Scenario 4: No Prior Payment**
- Price adjustment is recorded in TicketPriceAdjustment
- NO adjustment payment is created (nothing to adjust)

### 6. Benefits

✅ **Complete Audit Trail** - Every price change is documented with a payment record
✅ **Financial Compliance** - Original records are never modified
✅ **Transparent History** - Can see all adjustments and when/why they happened
✅ **Accurate Reporting** - Total paid = sum of all payments (including adjustments)
✅ **Dispute Resolution** - Clear record if customer questions charges
✅ **Reversible** - If mistake is made, can create another adjustment to reverse

### 7. Viewing Adjustments

**In Payment List:**
- Adjustment payments show with `isAdjustment: true`
- Display with special indicator (e.g., "Price Adjustment" badge)
- Link to original payment via `originalPaymentId`

**In Ticket Details:**
- Shows all payments including adjustments
- Price adjustment history shows reason and who made the change
- Can calculate: `Total Owed = finalPrice - sum(all payments)`

### 8. Future Enhancements (Optional)

1. **Adjustment Approval Flow**: Require manager approval for adjustments over a threshold
2. **Automatic Customer Notifications**: Send SMS/email when price changes
3. **Refund Processing**: Auto-process refunds for negative adjustments
4. **Adjustment Reports**: Dashboard showing all price adjustments by period
5. **Link to Invoices**: Update/reissue invoices when prices change

## Usage Example

```typescript
// Adjust ticket price after payment
await fetch(`/api/tickets/${ticketId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    finalPrice: 150.00,  // New price
    priceAdjustmentReason: "Added screen protector upon customer request"
  })
});

// Result:
// - TicketPriceAdjustment record created
// - If ticket has payments: Adjustment payment auto-created
// - Ticket.finalPrice updated to 150.00
// - Ticket.paid = false (if not fully paid after adjustment)
```

## Database Queries

**Find all adjustment payments:**
```sql
SELECT * FROM Payment WHERE isAdjustment = true;
```

**Find adjustments for a ticket:**
```sql
SELECT p.* FROM Payment p
WHERE p.ticketId = 'ticket123' AND p.isAdjustment = true
ORDER BY p.createdAt DESC;
```

**Calculate actual amount paid (excluding adjustments):**
```sql
SELECT SUM(amount) FROM Payment 
WHERE ticketId = 'ticket123' AND isAdjustment = false;
```

**Calculate total with adjustments:**
```sql
SELECT SUM(amount) FROM Payment 
WHERE ticketId = 'ticket123';
```
