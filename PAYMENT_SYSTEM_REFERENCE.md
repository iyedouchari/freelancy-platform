# Payment Flow - Complete Reference

## 💰 Payment Timeline & Amounts

### Deal Example: 100 DT Total Price
- **Advance**: 30 DT (30% paid upfront)
- **Final**: 70 DT (70% paid after delivery)

---

## 🎯 Scenario 1: Freelancer On Time ✅

### Step 1: Advance Payment
```
CLIENT INITIATES:
├─ Balance: 100 DT (in wallet)
├─ Pays advance: -30 DT
└─ Balance: 70 DT

SYSTEM WALLET (ID 999):
├─ Receives: +30 DT (held in escrow)
└─ Status: Holding advance

DEAL STATUS: "En cours"
```

### Step 2: Freelancer Submits Work (Day 15, on time!)
```
FREELANCER WALLET:
├─ Receives: +30 DT (advance released immediately!)
├─ No penalties (submitted on deadline)
└─ Balance: 30 DT ✅

DEAL STATUS: "Terminé" (work submitted)
WALLET HISTORY:
└─ Transaction type: submission_release
   Amount: 30 DT
   Note: "Paiement libere a la soumission de travail"
```

### Step 3: Client Pays Final (Within 24h Grace Period) ✅
```
CLIENT:
├─ Remaining balance: 70 DT (needed for final payment)
├─ Pays final: -70 DT
└─ Balance: 0 DT

SYSTEM WALLET:
├─ Receives: +70 DT (final payment)
├─ Now holds: 30 + 70 = 100 DT total
└─ Releases ALL to freelancer

FREELANCER RECEIVES:
├─ What they already have: 30 DT
├─ Plus final payment: +70 DT
└─ TOTAL: 100 DT ✅

DEAL STATUS: "Totalité payé"
```

### Final Result
```
Freelancer: 100 DT ✓
Client: Paid 100 DT total
System: Empty (all distributed)
```

---

## ⏰ Scenario 2: Freelancer 3 Days Late 🚨

### Step 1: Advance Payment (Same)
```
CLIENT: -30 DT → SYSTEM WALLET
SYSTEM: +30 DT (escrow)
DEAL STATUS: "En cours"
```

### Step 2: Freelancer Submits Work (Day 18 - 3 days late!)
```
PENALTY CALCULATION:
├─ Days late: 3 days (deadline was day 15)
├─ Cycles: floor(3 / 3) = 1 cycle
├─ Penalty: 100 DT × 0.10 × 1 = 10 DT
└─ Net for freelancer: 30 - 10 = 20 DT

FREELANCER WALLET:
├─ Receives advance: +30 DT
├─ Penalty deducted: -10 DT
├─ WALLET TRANSACTION 1: submission_release +30 DT
├─ WALLET TRANSACTION 2: penalty_debit -10 DT
└─ Balance: 20 DT ✅

CLIENT WALLET:
├─ Receives penalty refund: +10 DT (for waiting)
├─ WALLET TRANSACTION: penalty_credit +10 DT
└─ Updated balance: 70 + 10 = 80 DT

DEAL STATUS: "Terminé" (but with penalty note)
```

### Step 3A: Client Pays Final (Grace Period OK) ✅
```
CLIENT:
├─ Available balance: 80 DT (70 remaining + 10 penalty refund)
├─ Pays final: -70 DT
└─ Balance: 10 DT (has penalty refund left)

SYSTEM WALLET RELEASES:
├─ 30 DT (advance) - already with freelancer
├─ 70 DT (final) - now released
└─ Freelancer receives +70 DT

FREELANCER GETS:
├─ Already has: 20 DT (advance minus penalty)
├─ Plus final: +70 DT
└─ TOTAL: 90 DT ✓

DEAL STATUS: "Totalité payé"

Final Wallets:
├─ Freelancer: 90 DT (100 - 10 penalty)
├─ Client: 10 DT (penalty refund for the wait)
└─ System: Empty
```

### Step 3B: Client Doesn't Pay (Grace Period Expires) ❌
```
AFTER 24+ HOURS - No final payment:

AUTO-CANCELLATION TRIGGERED:
├─ Deal status: "Annule"
├─ No additional payments processed
├─ Freelancer keeps what they already got: 20 DT
├─ Client keeps penalty refund: 10 DT

FREELANCER GETS:
└─ 20 DT (they keep it, deal is over)

DEAL STATUS: "Annule"
```

---

## 📊 Wallet Transaction Types

| Type | Wallet | Amount | Description | When |
|------|--------|--------|-------------|------|
| `advance_debit` | Client | -30 | Client pays advance | Initial payment |
| `advance_credit` | System | +30 | System holds advance | Initial payment |
| `submission_release` | Freelancer | +30 | Advance released on work | Submission |
| `penalty_debit` | Freelancer | -10 | Penalty deducted | Submission (if late) |
| `penalty_credit` | Client | +10 | Penalty refunded | Submission (if late) |
| `final_debit` | Client | -70 | Client pays final | Final payment |
| `final_credit` | System | +70 | System receives final | Final payment |

---

## 🔍 Complete Wallet History Example (Late Freelancer)

### Client's Wallet History
```
1. ADVANCE_DEBIT (Initial)
   Amount: -30 DT
   Type: advance_debit
   Balance: 70 DT

2. PENALTY_CREDIT (Received back for wait)
   Amount: +10 DT
   Type: penalty_credit
   Note: "Penalite de retard returned pour freelancer en retard: 10.00 DT"
   Balance: 80 DT

3. FINAL_DEBIT (Paid final amount)
   Amount: -70 DT
   Type: final_debit
   Balance: 10 DT
```

### Freelancer's Wallet History
```
1. SUBMISSION_RELEASE (Paid on work submit)
   Amount: +30 DT
   Type: submission_release
   Note: "Paiement libere a la soumission. Penalite potentielle: 10.00 DT"
   Balance: 30 DT

2. PENALTY_DEBIT (Late penalty)
   Amount: -10 DT
   Type: penalty_debit
   Note: "Penalite de retard deduite: 10.00 DT (1 cycle(s))"
   Balance: 20 DT

3. (When client pays)
   FINAL_CREDIT (Final payment released)
   Amount: +70 DT
   Type: final_credit
   Balance: 90 DT
```

---

## ⚠️ Edge Cases

### Case 1: Client Never Pays Advance
```
Result: Deal stuck in "En attente acompte"
Freelancer: Never starts work
System: Waiting for advance payment
```

### Case 2: Freelancer Never Submits Work
```
Result: Deal stays "En cours"
System: Holds advance indefinitely
Freelancer: No payment released
```

### Case 3: Client Pays Advance + Final Together (payTotal)
```
System processes as:
├─ Advance payment created
├─ Final payment created
├─ Both marked as "Paye"
└─ Freelancer gets all at once after submission
```

---

## 🎯 Key Rules

1. **Advance is always released at submission** (immediately, not waiting for final payment)
2. **Penalties deducted at submission** (if freelancer is late)
3. **Penalties returned to client** (as compensation for the wait)
4. **Final payment still required** (unless deal auto-cancels)
5. **24-hour grace period** (client has 24h to pay final, or deal auto-cancels)
6. **Freelancer keeps advance** (even if deal auto-cancels)

---

## ✅ Payment System Status

- ✅ Advance payment system working
- ✅ Freelancer immediate payment on submission
- ✅ Penalty calculation (10% per 3-day cycle)
- ✅ Penalty refund to client
- ✅ 24-hour grace period enforcement
- ✅ Auto-cancellation after grace expires
- ✅ Complete wallet transaction history
- ✅ Transaction notes for transparency

All systems operational and tested ✓
