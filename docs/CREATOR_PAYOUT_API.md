# DELULU CREATOR PAYOUT API
## Technical Architecture & Integration Guide

---

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                      DELULU ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │  Client  │───>│ Firebase │───>│  Payout  │                 │
│   │   App    │    │ Functions│    │  Engine  │                 │
│   └──────────┘    └──────────┘    └──────────┘                 │
│        │              │                │                        │
│        v              v                v                        │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │ Firestore│    │ Analytics│    │  Stripe  │                 │
│   │   DB     │    │ BigQuery │    │  Connect │                 │
│   └──────────┘    └──────────┘    └──────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA MODELS

### 2.1 Creator Wallet
```typescript
interface CreatorWallet {
  userId: string;                    // Firebase UID
  balance: number;                   // Current Gem balance
  lifetimeEarnings: number;         // Total earned (Gems)
  lifetimePayouts: number;          // Total paid out (€)
  pendingPayout: number;            // Awaiting processing
  tier: 'rising' | 'established' | 'star' | 'legend';
  revenueShare: number;             // 0.60 - 0.75
  payoutMethod?: PayoutMethod;
  lastPayout?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PayoutMethod {
  type: 'paypal' | 'sepa' | 'wise';
  email?: string;                   // PayPal
  iban?: string;                    // SEPA (masked)
  accountId?: string;               // Wise
  verified: boolean;
  verifiedAt?: Timestamp;
}
```

### 2.2 Transaction
```typescript
interface Transaction {
  id: string;
  type: 'gift_received' | 'tip_received' | 'subscription' | 'payout';
  creatorId: string;
  senderId?: string;                // For gifts/tips
  amount: number;                   // Gems or €
  currency: 'gems' | 'eur';
  netAmount: number;                // After revenue share
  revenueShare: number;             // Applied rate
  giftId?: string;                  // For virtual gifts
  subscriptionTier?: string;        // For subscriptions
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Timestamp;
  processedAt?: Timestamp;
}
```

### 2.3 Payout Request
```typescript
interface PayoutRequest {
  id: string;
  creatorId: string;
  amount: number;                   // € amount
  gemsConverted: number;            // Gems converted
  conversionRate: number;           // Gems per €1
  method: PayoutMethod;
  status: 'requested' | 'processing' | 'completed' | 'failed' | 'cancelled';
  failureReason?: string;
  transactionRef?: string;          // External payment ref
  requestedAt: Timestamp;
  processedAt?: Timestamp;
}
```

---

## 3. API ENDPOINTS

### 3.1 Wallet Operations

#### Get Wallet Balance
```
GET /api/creator/wallet

Response:
{
  "success": true,
  "wallet": {
    "balance": 15420,
    "balanceEur": 154.20,
    "pendingPayout": 0,
    "tier": "star",
    "revenueShare": 0.70,
    "lifetimeEarnings": 45000,
    "lifetimePayoutsEur": 300.00
  }
}
```

#### Get Transaction History
```
GET /api/creator/transactions?limit=50&offset=0&type=all

Response:
{
  "success": true,
  "transactions": [...],
  "pagination": {
    "total": 234,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3.2 Payout Operations

#### Request Payout
```
POST /api/creator/payout/request

Body:
{
  "amount": 50.00,           // € amount (min €25)
  "method": "paypal"
}

Response:
{
  "success": true,
  "payout": {
    "id": "pay_abc123",
    "amount": 50.00,
    "gemsDeducted": 5000,
    "estimatedArrival": "2026-02-15",
    "status": "processing"
  }
}
```

#### Get Payout Status
```
GET /api/creator/payout/:payoutId

Response:
{
  "success": true,
  "payout": {
    "id": "pay_abc123",
    "amount": 50.00,
    "status": "completed",
    "processedAt": "2026-02-15T10:00:00Z",
    "transactionRef": "STRIPE_TXN_xyz"
  }
}
```

#### Setup Payout Method
```
POST /api/creator/payout/method

Body:
{
  "type": "paypal",
  "email": "creator@example.com"
}

Response:
{
  "success": true,
  "verification": {
    "required": true,
    "method": "email",
    "expiresAt": "2026-02-01T12:00:00Z"
  }
}
```

### 3.3 Gift & Tip Processing

#### Process Incoming Gift
```
// Internal Cloud Function - triggered by gift transaction
async function processGiftTransaction(gift: GiftTransaction) {
  const creator = await getCreatorWallet(gift.recipientId);
  const revenueShare = CREATOR_TIERS[creator.tier].revenueShare;

  const netAmount = Math.floor(gift.amount * revenueShare);

  await updateWallet(creator.userId, {
    balance: increment(netAmount),
    lifetimeEarnings: increment(netAmount),
  });

  await createTransaction({
    type: 'gift_received',
    creatorId: creator.userId,
    senderId: gift.senderId,
    amount: gift.amount,
    netAmount: netAmount,
    revenueShare: revenueShare,
    giftId: gift.giftId,
    status: 'completed',
  });
}
```

---

## 4. CONVERSION RATES

### Gem to EUR Conversion
```typescript
const GEM_CONVERSION_RATE = 100; // 100 Gems = €1.00

function gemsToEur(gems: number): number {
  return gems / GEM_CONVERSION_RATE;
}

function eurToGems(eur: number): number {
  return Math.floor(eur * GEM_CONVERSION_RATE);
}
```

### Revenue Share Calculation
```typescript
function calculateCreatorEarnings(
  grossGems: number,
  tier: CreatorTier
): { netGems: number; platformFee: number } {
  const revenueShare = CREATOR_TIERS[tier].revenueShare;
  const netGems = Math.floor(grossGems * revenueShare);
  const platformFee = grossGems - netGems;

  return { netGems, platformFee };
}

// Example:
// Creator receives 1000 Gems gift
// Tier: Star (70% share)
// Net: 700 Gems (€7.00)
// Platform: 300 Gems (€3.00)
```

---

## 5. SECURITY & COMPLIANCE

### 5.1 Authentication
All API calls require Firebase Auth token:
```
Authorization: Bearer <firebase_id_token>
```

### 5.2 Rate Limiting
| Endpoint | Limit |
|----------|-------|
| GET /wallet | 60/min |
| GET /transactions | 30/min |
| POST /payout/request | 5/day |
| POST /payout/method | 3/day |

### 5.3 Fraud Prevention
```typescript
const PAYOUT_RULES = {
  minAmount: 25.00,              // Minimum €25
  maxDailyAmount: 500.00,        // Max €500/day
  maxMonthlyAmount: 5000.00,     // Max €5000/month
  cooldownHours: 24,             // 24h between payouts
  verificationRequired: true,    // Payout method must be verified
  holdPeriod: 7,                 // 7 days hold for new accounts
};
```

### 5.4 KYC Requirements
| Tier | Earnings Threshold | KYC Required |
|------|-------------------|--------------|
| Rising | €0 - €100 | Basic Email |
| Established | €100 - €500 | ID Verification |
| Star/Legend | €500+ | Full KYC + Tax ID |

---

## 6. WEBHOOKS

### Gift Received
```json
{
  "event": "gift.received",
  "creatorId": "user_123",
  "data": {
    "giftId": "heart",
    "senderId": "user_456",
    "grossAmount": 100,
    "netAmount": 70,
    "timestamp": "2026-01-31T15:00:00Z"
  }
}
```

### Payout Completed
```json
{
  "event": "payout.completed",
  "creatorId": "user_123",
  "data": {
    "payoutId": "pay_abc123",
    "amount": 50.00,
    "method": "paypal",
    "transactionRef": "STRIPE_xyz",
    "timestamp": "2026-02-15T10:00:00Z"
  }
}
```

---

## 7. ERROR CODES

| Code | Message | Resolution |
|------|---------|------------|
| `INSUFFICIENT_BALANCE` | Not enough Gems for payout | Wait for more earnings |
| `BELOW_MINIMUM` | Amount below €25 minimum | Increase amount |
| `PAYOUT_COOLDOWN` | Payout requested too recently | Wait 24 hours |
| `METHOD_NOT_VERIFIED` | Payout method not verified | Complete verification |
| `KYC_REQUIRED` | KYC verification needed | Submit documents |
| `ACCOUNT_HOLD` | Account under review | Contact support |
| `RATE_LIMITED` | Too many requests | Wait and retry |

---

## 8. INTEGRATION EXAMPLE

### React Hook: useCreatorWallet
```typescript
import { useState, useEffect } from 'react';
import { getCreatorWallet, requestPayout } from '@/lib/creatorEconomy';

export const useCreatorWallet = () => {
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const data = await getCreatorWallet();
    setWallet(data);
    setIsLoading(false);
  };

  const withdraw = async (amount: number) => {
    const result = await requestPayout(amount);
    if (result.success) {
      await loadWallet(); // Refresh balance
    }
    return result;
  };

  return { wallet, isLoading, withdraw, refresh: loadWallet };
};
```

---

## 9. MONITORING & ANALYTICS

### Key Metrics Tracked
- Daily Active Creators (DAC)
- Average Revenue Per Creator (ARPC)
- Gift Volume (daily/weekly/monthly)
- Payout Processing Time
- Failed Payout Rate
- Platform Revenue

### Alerts
- Unusual payout patterns (fraud detection)
- High failure rates
- Processing delays > 48h

---

*API Version: 1.0 | Last Updated: January 2026*
