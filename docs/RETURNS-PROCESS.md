# Returns & Refunds Process Documentation
## Task 17.12 - Return Documentation

**Last Updated**: Week 17 Implementation
**Version**: 1.0.0

---

## Overview

Complete returns and refunds system allowing customers to request returns, store owners to approve/reject, process inspections, and issue refunds.

---

## Return Flow (State Machine)

```
Customer            Store Owner          System
   │                    │                  │
   ├─ Request Return ─→ │                  │
   │                    │                  │
   │              ┌─────┴─────┐           │
   │              │  PENDING  │           │
   │              └─────┬─────┘           │
   │                    │                  │
   │              ┌─────┴─────┐           │
   │              │  Approve? │           │
   │              └─────┬─────┘           │
   │                    │                  │
   │         ┌──────────┼──────────┐      │
   │         │          │          │      │
   │    APPROVED    REJECTED       │      │
   │         │                     │      │
   ├─ Ship ─┤                     END    │
   │         │                            │
   │    SHIPPED ─────── Track ──→ RECEIVED
   │         │                            │
   │         │                      Inspection
   │         │                            │
   │         │                      INSPECTED
   │         │                            │
   │         │                      Process Refund
   │         │                            │
   │    REFUNDED ◄───────────────────────┘
```

---

## Return Statuses

| Status      | Description                              | Next Actions                     |
|-------------|------------------------------------------|----------------------------------|
| `PENDING`   | Customer submitted, awaiting approval    | Store: Approve or Reject         |
| `APPROVED`  | Approved, customer can ship return       | Customer: Ship items             |
| `REJECTED`  | Request denied                           | None (terminal state)            |
| `SHIPPED`   | Customer shipped return                  | System: Track delivery           |
| `RECEIVED`  | Store received return                    | Store: Inspect items             |
| `INSPECTED` | Items inspected and accepted/rejected    | System: Process refund           |
| `REFUNDED`  | Refund processed                         | None (terminal state)            |
| `CANCELLED` | Customer cancelled request               | None (terminal state)            |

---

## Return Window Policy

- **Standard**: 30 days from delivery
- **Configurable** per product category
- **Validation**: Automatic blocking after expiration
- **Notifications**: Alert customers 5 days before expiration

---

## Return Reasons

| Code                 | Description                              |
|----------------------|------------------------------------------|
| `DEFECTIVE`          | Product is defective or broken           |
| `NOT_AS_DESCRIBED`   | Product doesn't match description/photos |
| `WRONG_ITEM`         | Received wrong product                   |
| `CHANGED_MIND`       | Customer no longer wants item            |
| `SIZE_ISSUE`         | Wrong size or fit                        |
| `DAMAGED_SHIPPING`   | Damaged during shipping                  |
| `OTHER`              | Other reason (requires description)      |

---

## API Endpoints

### Create Return Request
```
POST /api/orders/[orderId]/return-request

Body:
{
  "reason": "DEFECTIVE",
  "description": "Item stopped working after 2 days",
  "items": [
    {
      "productId": "prod_123",
      "variantId": "var_456",
      "quantity": 1,
      "price": 99.99
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "returnRequest": {
    "id": "ret_789",
    "status": "PENDING",
    "refundAmount": "99.99"
  }
}
```

### Approve Return
```
POST /api/return-requests/[id]/approve

Body:
{
  "approvalNotes": "Approved - valid defect claim"
}

Response: 200 OK
{
  "success": true,
  "returnRequest": {
    "id": "ret_789",
    "status": "APPROVED",
    "trackingNumber": "EST123456",
    "labelUrl": "https://..."
  }
}
```

### Reject Return
```
POST /api/return-requests/[id]/reject

Body:
{
  "rejectionReason": "Outside 30-day return window"
}
```

### Process Refund
```
POST /api/return-requests/[id]/refund

Response: 200 OK
{
  "success": true,
  "refund": {
    "id": "ref_123",
    "amount": 99.99,
    "provider": "STRIPE"
  }
}
```

---

## Staff Procedures

### 1. Review Return Request
- Check return reason and description
- Verify order is within return window
- Review customer history (return rate)
- Make decision: Approve or Reject

### 2. If Approved
- System generates return shipping label
- Email sent to customer with instructions
- Track return shipment status

### 3. Upon Receipt
- Mark as RECEIVED in system
- Physically inspect items
- Record inspection results:
  - Accept (refund eligible)
  - Reject (refund ineligible - explain why)

### 4. Process Refund
- System processes through Stripe/Mercado Pago
- Restocks accepted items
- Sends confirmation email to customer

---

## Inspection Guidelines

**Accept if:**
- Item matches return description
- Product in resalable condition
- Original packaging (if required)
- No signs of misuse

**Reject if:**
- Item damaged by customer
- Missing parts/accessories
- Signs of extensive use
- Not the original product

---

## Metrics & Analytics

**Track:**
- Total returns
- Return rate (% of orders)
- Returns by reason
- Average processing time
- Top returned products
- Refund amounts

**Goals:**
- Return rate < 5%
- Processing time < 7 days
- 100% refund accuracy

---

## Customer Communication

**Email Templates:**
1. Return request received (confirmation)
2. Return approved (with label and instructions)
3. Return rejected (with explanation)
4. Return received (we got your items)
5. Refund processed (confirmation)

---

## Technical Implementation

**Database Models:**
- `ReturnRequest` - Main return record
- `ReturnItem` - Individual items being returned

**Status Transitions:**
- `PENDING → APPROVED → SHIPPED → RECEIVED → INSPECTED → REFUNDED`
- `PENDING → REJECTED` (terminal)
- Any → `CANCELLED` (customer cancels)

**Integrations:**
- Payment providers (Stripe, Mercado Pago) for refunds
- Shipping providers for return labels
- Email service for notifications

---

## Security & Compliance

- Validate user owns order before accepting return
- Enforce return window strictly
- Audit log all status changes
- Track who approved/rejected/inspected
- Secure refund processing (idempotent)

---

## Support Contacts

For returns issues, contact:
- **Technical**: dev@example.com
- **Operations**: ops@example.com
- **Customer Support**: support@example.com

---

**End of Returns Process Documentation**
