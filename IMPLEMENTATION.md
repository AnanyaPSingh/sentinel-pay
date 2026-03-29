Here is a comprehensive, structured agent prompt for building SentinelPay end-to-end:

---

```
═══════════════════════════════════════════════════════════════════
SENTINELPAY — AI CODING AGENT MASTER PROMPT
Policy-Enforced Autonomous Treasury Execution on Solana
═══════════════════════════════════════════════════════════════════

## AGENT ROLE & OPERATING INSTRUCTIONS

You are a senior full-stack blockchain engineer. Your task is to
build SentinelPay — a production-quality MVP — from scratch.
Work module by module. After completing each module, confirm it
compiles/runs correctly before proceeding. Never skip a module.
Never produce stub files; every file must have real, working code.

---

## PROJECT OVERVIEW

SentinelPay is a policy-enforced autonomous treasury execution
engine built on Solana. It allows institutions to define compliance
and risk rules as on-chain policies, then autonomously executes
cross-border stablecoin payments only when all rules are satisfied.

Submission target: StableHacks 2026 Hackathon (Track 3:
Programmable Stablecoin Payments)

---

## TECH STACK

### On-Chain
- Runtime:     Solana (Devnet)
- Framework:   Anchor (latest stable)
- Token:       SPL Token (USDC mock)
- Language:    Rust

### Off-Chain / Backend
- Runtime:     Node.js 20+
- Framework:   Express.js
- Language:    TypeScript
- Solana SDK:  @solana/web3.js, @coral-xyz/anchor
- DB:          SQLite via better-sqlite3 (local, no setup needed)

### Frontend
- Framework:   Next.js 14 (App Router)
- Styling:     Tailwind CSS
- Web3:        @solana/wallet-adapter-react
- Charts:      Recharts
- Language:    TypeScript

### Dev Tooling
- Package manager: pnpm (workspaces monorepo)
- Testing: Anchor test suite (Mocha/Chai)
- Linting: ESLint + Prettier

---

## REPOSITORY STRUCTURE

Create the following monorepo layout:

sentinel-pay/
├── anchor/                     ← Solana smart contracts
│   ├── programs/
│   │   └── sentinel_pay/
│   │       └── src/
│   │           ├── lib.rs
│   │           ├── instructions/
│   │           │   ├── mod.rs
│   │           │   ├── initialize_institution.rs
│   │           │   ├── create_policy.rs
│   │           │   ├── register_identity.rs
│   │           │   ├── create_payment.rs
│   │           │   ├── execute_payment.rs
│   │           │   └── release_escrow.rs
│   │           ├── state/
│   │           │   ├── mod.rs
│   │           │   ├── institution.rs
│   │           │   ├── policy.rs
│   │           │   ├── identity.rs
│   │           │   └── payment.rs
│   │           └── errors.rs
│   ├── tests/
│   │   └── sentinel_pay.ts
│   └── Anchor.toml
│
├── backend/                    ← Off-chain services
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── institution.ts
│   │   │   ├── identity.ts
│   │   │   ├── policy.ts
│   │   │   ├── payment.ts
│   │   │   └── audit.ts
│   │   ├── services/
│   │   │   ├── kycService.ts
│   │   │   ├── kytService.ts
│   │   │   ├── travelRuleService.ts
│   │   │   ├── fxService.ts
│   │   │   ├── policyEvaluator.ts
│   │   │   └── autonomousExecutor.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── database.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   ← Next.js dashboard
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── policies/
│   │   │   └── page.tsx
│   │   ├── identities/
│   │   │   └── page.tsx
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── audit/
│   │   │   └── page.tsx
│   │   └── regulator/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── policy/
│   │   │   ├── PolicyBuilder.tsx
│   │   │   └── PolicyCard.tsx
│   │   ├── payment/
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── PreflightCheck.tsx
│   │   │   └── PaymentStatus.tsx
│   │   ├── identity/
│   │   │   └── IdentityRegistry.tsx
│   │   ├── audit/
│   │   │   └── AuditTrail.tsx
│   │   └── regulator/
│   │       └── RegulatorView.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── solana.ts
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                ← pnpm workspace root
└── README.md

---

## MODULE 1 — SOLANA SMART CONTRACTS (Anchor)

### 1.1 Program State Accounts

Build the following on-chain state structs in `state/`:

#### Institution (state/institution.rs)
```rust
pub struct Institution {
    pub authority: Pubkey,         // Admin wallet
    pub name: String,              // e.g. "ACME Corp"
    pub jurisdiction: String,      // e.g. "EU", "IN", "US"
    pub is_active: bool,
    pub policy_count: u32,
    pub payment_count: u64,
    pub bump: u8,
}
```

#### Policy (state/policy.rs)
```rust
pub struct Policy {
    pub institution: Pubkey,
    pub policy_id: u64,
    pub name: String,
    // Jurisdiction whitelist e.g. ["EU", "US", "SG"]
    pub allowed_jurisdictions: Vec<String>,
    // Max transfer in USD cents (e.g. 1_000_000_00 = $1M)
    pub max_transfer_usd_cents: u64,
    // Min KYT score required (0–100, higher = cleaner)
    pub min_kyt_score: u8,
    // Force escrow for new counterparties (< n prior txns)
    pub escrow_new_counterparty_threshold: u8,
    pub is_active: bool,
    pub bump: u8,
}
```

#### Identity (state/identity.rs)
```rust
pub struct Identity {
    pub wallet: Pubkey,
    pub institution: Pubkey,
    pub entity_name: String,
    pub jurisdiction: String,      // "EU", "IN", "US", etc.
    pub kyc_verified: bool,
    pub kyc_expiry: i64,           // Unix timestamp
    // Risk tier: 0=LOW, 1=MEDIUM, 2=HIGH
    pub risk_tier: u8,
    pub transaction_count: u32,
    pub is_sanctioned: bool,
    pub bump: u8,
}
```

#### Payment (state/payment.rs)
```rust
pub enum PaymentStatus {
    Pending,
    InEscrow,
    Executed,
    Rejected,
    Released,
}

pub struct Payment {
    pub payment_id: u64,
    pub institution: Pubkey,
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount_usd_cents: u64,
    pub source_currency: String,    // "INR", "USD", "EUR"
    pub target_currency: String,
    pub fx_rate_bps: u64,           // FX rate * 10000
    pub status: PaymentStatus,
    pub policy_id: u64,
    // Travel Rule fields
    pub sender_vasp: String,
    pub receiver_vasp: String,
    pub reference: String,          // Invoice ID / memo
    // Pre-flight result
    pub preflight_passed: bool,
    pub rejection_reason: String,
    pub created_at: i64,
    pub executed_at: i64,
    pub bump: u8,
}
```

### 1.2 Instructions

Build the following instructions in `instructions/`:

#### initialize_institution
- Accounts: authority (signer), institution (PDA), system_program
- PDA seeds: ["institution", authority.key()]
- Validates: name.len() <= 64, jurisdiction in allowed list
- Sets all Institution fields, is_active = true

#### create_policy
- Accounts: authority (signer), institution (PDA), policy (PDA),
  system_program
- PDA seeds: ["policy", institution.key(), policy_id as bytes]
- Validates: max_transfer_usd_cents > 0, min_kyt_score <= 100
- Increments institution.policy_count

#### register_identity
- Accounts: authority (signer), institution (PDA), identity (PDA),
  wallet (the wallet being registered), system_program
- PDA seeds: ["identity", institution.key(), wallet.key()]
- Sets all Identity fields. is_sanctioned = false initially.
- Validates: kyc_expiry is in the future

#### create_payment
- Accounts: sender (signer), institution (PDA), sender_identity (PDA),
  receiver_identity (PDA), policy (PDA), payment (PDA), system_program
- PDA seeds: ["payment", institution.key(), payment_id as bytes]
- Runs ALL pre-flight checks ON-CHAIN:
  1. sender_identity.kyc_verified == true
  2. sender_identity.kyc_expiry > Clock::get()?.unix_timestamp
  3. receiver_identity.kyc_verified == true
  4. !sender_identity.is_sanctioned && !receiver_identity.is_sanctioned
  5. amount_usd_cents <= policy.max_transfer_usd_cents
  6. receiver_identity.jurisdiction in policy.allowed_jurisdictions
- If any check fails → set payment.status = Rejected with reason
- If receiver transaction_count < policy.escrow_threshold 
  → set status = InEscrow
- Else → set status = Pending (ready for execution)

#### execute_payment
- Accounts: executor (signer), institution (PDA), payment (PDA),
  sender_token_account (SPL), receiver_token_account (SPL),
  token_program
- Validates: payment.status == Pending && payment.preflight_passed
- Transfers SPL tokens from sender → receiver
- Attaches Travel Rule data into payment account
- Sets status = Executed, executed_at = now

#### release_escrow
- Accounts: authority (signer), institution (PDA), payment (PDA),
  sender_token_account, receiver_token_account, escrow_token_account
- Only callable by institution authority
- Validates: payment.status == InEscrow
- Transfers from escrow → receiver
- Sets status = Released

### 1.3 Error Codes (errors.rs)
Define these custom errors:
```
KycNotVerified, KycExpired, SanctionedEntity,
ExceedsMaxTransfer, JurisdictionNotAllowed,
PolicyInactive, InstitutionInactive,
InvalidPaymentStatus, UnauthorizedExecutor
```

### 1.4 Anchor Tests (tests/sentinel_pay.ts)
Write full integration tests for:
1. Initialize institution
2. Create a policy
3. Register two identities (sender + receiver)
4. Create a payment that PASSES preflight → assert status = Pending
5. Create a payment that FAILS (sanctioned entity) → assert Rejected
6. Create a payment that hits escrow threshold → assert InEscrow
7. Execute a passing payment → assert status = Executed
8. Release escrow → assert status = Released

---

## MODULE 2 — BACKEND SERVICES

### 2.1 Database Schema (db/schema.ts)
Create SQLite tables:
- `institutions`: mirror of on-chain + off-chain metadata
- `identities`: kyc_data, risk_scores, vasp_info
- `policies`: all policy fields + JSON rules blob
- `payments`: full payment record + travel_rule_payload (JSON)
- `audit_logs`: id, payment_id, event_type, actor, timestamp, details

### 2.2 KYC Service (services/kycService.ts)
Mock implementation that:
- Assigns a KYC tier (VERIFIED / PENDING / REJECTED) based on
  a deterministic function of wallet address
- Returns: entity_name, jurisdiction, kyc_level, expiry_date,
  risk_tier (0/1/2)
- Expiry is set to 1 year from now for VERIFIED entities
- Add helper: isKycValid(wallet) → boolean

### 2.3 KYT Service (services/kytService.ts)
Mock transaction risk scoring:
- Input: sender_wallet, receiver_wallet, amount, memo
- Scoring algorithm (deterministic, not random):
  - Base score: 80
  - Deduct 30 if amount > 500,000 USD
  - Deduct 20 if sender has < 3 prior transactions
  - Deduct 25 if memo contains flagged keywords
    (["mixer", "unknown", "cash", "anonymous"])
  - Deduct 15 if sender and receiver are in different risk tiers
- Return: { score: number, flags: string[], recommendation: string }
  where recommendation is one of:
  "ALLOW" | "ALLOW_WITH_ESCROW" | "MANUAL_REVIEW" | "BLOCK"

### 2.4 Travel Rule Service (services/travelRuleService.ts)
Builds the Travel Rule payload per FATF guidelines:
```typescript
interface TravelRulePayload {
  transactionId: string;
  originatingVasp: {
    name: string;
    lei: string;           // Legal Entity Identifier (mocked)
    jurisdiction: string;
  };
  beneficiaryVasp: {
    name: string;
    lei: string;
    jurisdiction: string;
  };
  originator: {
    name: string;
    walletAddress: string;
    accountNumber: string; // mocked
  };
  beneficiary: {
    name: string;
    walletAddress: string;
    accountNumber: string;
  };
  transferAmount: number;
  currency: string;
  timestamp: string;
  signature: string;       // SHA256 hash of payload
}
```
- Implement: buildPayload(), verifyPayload(), serializeForChain()

### 2.5 FX Service (services/fxService.ts)
Mock FX routing engine:
- Supported pairs: INR/USDC, EUR/USDC, GBP/USDC, SGD/USDC
- Hardcode realistic rates with ±0.5% simulated spread
- Implement: getRate(from, to), convertAmount(amount, from, to)
- Add route optimizer: getBestRoute(from, to, amount) that returns
  the optimal path (direct vs via USDC) and estimated fees

### 2.6 Policy Evaluator (services/policyEvaluator.ts)
The off-chain mirror of the on-chain policy checks:
- Input: PaymentRequest + Policy + KYC result + KYT result
- Run all checks in sequence, collect ALL failures (don't stop at first)
- Return:
```typescript
interface PreflightResult {
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    reason?: string;
  }[];
  requiresEscrow: boolean;
  suggestedAction: "EXECUTE" | "ESCROW" | "MANUAL" | "BLOCK";
  kytScore: number;
  travelRulePayload: TravelRulePayload;
}
```

### 2.7 Autonomous Executor (services/autonomousExecutor.ts)
The treasury automation engine:
- Polls the backend DB every 30s for payments with
  status = "PENDING_EXECUTION" and autonomous_mode = true
- For each pending payment:
  1. Re-run preflight (KYT can change)
  2. If passed → submit execute_payment instruction to Solana
  3. Log result to audit_logs
  4. Emit a server-sent event (SSE) for real-time UI updates
- Implement enable/disable toggle per institution
- Rate limit: max 10 autonomous executions per minute

### 2.8 REST API Routes

#### POST /api/institution/register
Body: { name, jurisdiction, authorityWallet }
Returns: { institutionPda, txSignature }

#### POST /api/identity/kyc
Body: { wallet, institutionPda }
Runs KYC, stores result, calls register_identity on-chain
Returns: { identityPda, kycStatus, riskTier }

#### GET /api/identity/:wallet
Returns full identity record + KYT history

#### POST /api/policy/create
Body: { institutionPda, name, allowedJurisdictions,
        maxTransferUsdCents, minKytScore, escrowThreshold }
Creates policy on-chain + stores off-chain
Returns: { policyPda, policyId }

#### GET /api/policy/:institutionPda
Returns all policies for institution

#### POST /api/payment/preflight
Body: { sender, receiver, amountUsdCents, sourceCurrency,
        targetCurrency, policyId, institutionPda, memo }
Runs full off-chain preflight WITHOUT submitting to chain
Returns: PreflightResult (described in 2.6)

#### POST /api/payment/create
Same body as preflight
Runs preflight THEN submits create_payment on-chain
Returns: { paymentPda, paymentId, status, preflightResult }

#### POST /api/payment/:paymentId/execute
Manually triggers execution (when autonomous mode is off)
Returns: { txSignature, status }

#### POST /api/payment/:paymentId/release-escrow
Releases escrowed payment (authority only)
Returns: { txSignature, status }

#### GET /api/payment/:institutionPda/list
Query params: status, page, limit
Returns paginated payment list

#### GET /api/audit/:institutionPda
Query params: startDate, endDate, paymentId
Returns audit trail records

#### GET /api/audit/:paymentId/travel-rule
Returns the Travel Rule payload for a specific payment

#### GET /api/regulator/:institutionPda/report
Returns full regulatory report:
{ institutionSummary, identityMap, paymentGraph,
  suspiciousActivity, travelRulePayloads }

#### POST /api/autonomous/toggle
Body: { institutionPda, enabled }
Enables/disables autonomous execution mode

#### GET /api/events/:institutionPda (SSE endpoint)
Server-sent events for real-time payment status updates

---

## MODULE 3 — FRONTEND DASHBOARD

### 3.1 Layout & Navigation
Build a sidebar dashboard with these navigation items:
- Overview (home icon)
- Policies (shield icon)
- Identities / KYC (users icon)
- Payments (arrow-right-left icon)
- Audit Trail (list icon)
- Regulator View (eye icon)
- Autonomous Mode toggle (power icon, in header)

Use a dark institutional color scheme:
- Background: #0F1117
- Surface: #1A1D27
- Accent: #6366F1 (indigo)
- Success: #10B981
- Warning: #F59E0B
- Danger: #EF4444
- Text: #F1F5F9

### 3.2 Overview Dashboard (app/dashboard/page.tsx)
Display:
- Stat cards: Total Payments, Total Volume (USD), Blocked Payments,
  Avg Settlement Time
- Line chart: Payment volume over last 7 days (Recharts)
- Bar chart: Payments by status (Recharts)
- Recent payments table (last 10)
- Autonomous Mode status banner (green if on, grey if off)

### 3.3 Policy Builder (components/policy/PolicyBuilder.tsx)
A form-based UI to create policies:
- Institution selector (dropdown)
- Policy name (text input)
- Allowed jurisdictions (multi-select checkboxes):
  EU, US, UK, SG, IN, CH, AE
- Max transfer amount (number input with currency selector)
- Min KYT score (slider: 0–100)
- Escrow threshold (number: transactions before trusted)
- Submit → POST /api/policy/create → show success with PDA address
- List existing policies as cards below the form
  (each card shows all rules, active/inactive badge)

### 3.4 Identity Registry (components/identity/IdentityRegistry.tsx)
- Input a wallet address → POST /api/identity/kyc
- Show KYC result as a detailed card:
  - Entity name, jurisdiction, risk tier badge
  - KYC status (green/red), expiry date
  - Transaction count
  - Sanctions check result
- Table of all registered identities with sort/filter

### 3.5 Payment Flow (app/payments/page.tsx)
**This is the demo centrepiece. Build it as a multi-step wizard:**

Step 1 — Payment Details
- Sender wallet (select from registered identities)
- Receiver wallet (select from registered identities)
- Amount + source currency
- Target currency
- Policy selector
- Invoice reference / memo
- "Run Pre-flight Check" button

Step 2 — Pre-flight Results Panel (CRITICAL)
Show a visual checklist of every compliance check:
```
✅ Sender KYC Verified        — Valid until Dec 2026
✅ Receiver KYC Verified      — Valid until Mar 2027
✅ Sanctions Check Clear       — Both parties clean
✅ Jurisdiction Allowed        — IN → EU allowed by policy
⚠️ KYT Score: 62/100          — Medium risk, escrow required
✅ Amount Within Limit         — $45,000 < $1,000,000
✅ Travel Rule Payload Ready   — FATF compliant
─────────────────────────────────────────────
VERDICT: PROCEED WITH ESCROW
```
If blocked, show a red panel: "TRANSACTION BLOCKED" with each
failed check highlighted in red and the rejection reason.

Step 3 — FX Route Preview
- Show: INR → USDC → EUR path
- Display: input amount, FX rate, estimated fees, output amount
- "Confirm & Submit" button

Step 4 — Execution & Status
- Show transaction being submitted (spinner)
- On success: green confirmation with Solana Explorer link
- Show payment status badge (Pending / InEscrow / Executed)
- Display the full Travel Rule payload in a collapsible section

### 3.6 Audit Trail (app/audit/page.tsx)
- Filter by: date range, payment ID, event type, actor
- Timeline view of all audit events per payment
- Each event shows: timestamp, event type, actor wallet, details
- Export to CSV button

### 3.7 Regulator View (app/regulator/page.tsx)
A special read-only view labelled "REGULATOR MODE":
- Full identity map: nodes = wallets, edges = payment flows
  (use a simple D3 or Recharts network graph)
- Source of funds trace for any wallet (input wallet → show graph)
- Suspicious activity flags (KYT score < 40 highlighted in red)
- Travel Rule payload viewer (select payment → see full FATF payload)
- Printable summary report button

### 3.8 Autonomous Mode Banner
- Floating toggle in the header
- When ON: green banner "AUTONOMOUS MODE ACTIVE — System is
  auto-executing compliant payments"
- When OFF: grey banner "MANUAL MODE — Payments require approval"
- On toggle → POST /api/autonomous/toggle
- Real-time payment execution events appear as toast notifications
  (via SSE connection to /api/events/:institutionPda)

---

## MODULE 4 — INTEGRATION & WIRING

### 4.1 Solana Devnet Config
- Configure Anchor.toml for devnet
- Use USDC devnet mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
- Create a devnet wallet keypair for the program authority
- Airdrop SOL to test wallets in setup script

### 4.2 Backend ↔ Solana
- Load the deployed program IDL in the backend
- Use a backend-controlled keypair as the executor wallet
- Wrap all Solana calls in retry logic (3 attempts, 2s backoff)

### 4.3 Frontend ↔ Backend
- All API calls go through frontend/lib/api.ts (single axios client)
- Base URL from env: NEXT_PUBLIC_API_URL
- Add loading states + error boundaries to every API call

### 4.4 Environment Variables
Create .env.example files for both backend and frontend:

Backend:
```
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<deployed_program_id>
EXECUTOR_KEYPAIR=<base64_keypair>
PORT=3001
DB_PATH=./sentinel.db
```

Frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

---

## MODULE 5 — DEMO SEED DATA & SCRIPTS

Create scripts/seed.ts that:
1. Initialises one institution: "ACME Exports Ltd" (jurisdiction: IN)
2. Creates one policy:
   - Name: "Cross-Border Export Policy"
   - Allowed: EU, US, SG, UK
   - Max transfer: $500,000
   - Min KYT score: 50
   - Escrow threshold: 3 transactions
3. Registers 3 identities:
   - Alice (IN, LOW risk, 10 prior txns) ← trusted sender
   - Bob (EU, LOW risk, 2 prior txns) ← new counterparty → triggers escrow
   - Charlie (US, HIGH risk, sanctioned) ← triggers block
4. Creates 4 demo payments:
   - Alice → Bob: $45,000 (should go to escrow)
   - Alice → Bob: $45,000 (second time, should execute)
   - Alice → Charlie: $10,000 (should be blocked)
   - Alice → Bob: $600,000 (exceeds limit → blocked)

This seed data powers the demo video exactly.

---

## MODULE 6 — README & SUBMISSION DOCS

### README.md must include:
1. Project overview (3 sentences max)
2. Architecture diagram (ASCII art is fine)
3. How to run locally (exact commands, no ambiguity):
   ```
   pnpm install
   cd anchor && anchor build && anchor deploy
   cd ../backend && pnpm dev
   cd ../frontend && pnpm dev
   pnpm seed
   ```
4. Deployed program ID on devnet
5. Demo walkthrough (step-by-step of the 6-step demo flow)
6. Hackathon track: Track 3 — Programmable Stablecoin Payments
7. Compliance coverage: KYC ✅ KYT ✅ AML ✅ Travel Rule ✅

---

## BUILD ORDER (follow strictly)

Execute in this exact sequence:

1. Scaffold monorepo with pnpm workspaces
2. Build Anchor program (Module 1) — compile to completion
3. Run Anchor tests — all 8 must pass on devnet
4. Build backend services (Module 2) — start with DB + types
5. Build REST API routes (Module 2.8)
6. Build frontend layout + navigation (Module 3.1)
7. Build Overview dashboard (Module 3.2)
8. Build Policy Builder UI (Module 3.3)
9. Build Identity Registry UI (Module 3.4)
10. Build Payment Wizard — pre-flight panel is HIGHEST priority
    (Module 3.5)
11. Build Audit Trail (Module 3.6)
12. Build Regulator View (Module 3.7)
13. Wire Autonomous Mode (Module 3.8)
14. Run seed script (Module 5)
15. Verify the full demo flow works end-to-end
16. Write README (Module 6)

---

## QUALITY CHECKLIST (verify before declaring done)

[ ] anchor build completes with zero warnings
[ ] All 8 Anchor tests pass
[ ] Preflight correctly blocks sanctioned entity
[ ] Preflight correctly routes new counterparty to escrow
[ ] Preflight passes for trusted, policy-compliant payment
[ ] Travel Rule payload is populated on every payment
[ ] Autonomous executor runs without crashing for 5 minutes
[ ] FX conversion is shown in payment wizard step 3
[ ] Regulator view shows all 4 seed payments with correct statuses
[ ] Audit trail shows events for each payment state change
[ ] SSE updates arrive in UI when autonomous executor fires

---

## CONSTRAINTS & RULES FOR THE AGENT

1. DO NOT use any LLM API in the core execution path.
   AI logic is only allowed in the policy suggestion feature
   (frontend helper, not enforcement).

2. Smart contract is the authority. The backend NEVER bypasses
   on-chain policy checks.

3. Every payment must generate a Travel Rule payload.
   No exceptions, even for amounts below threshold
   (over-compliance is fine for a hackathon MVP).

4. Mock services must be DETERMINISTIC. No Math.random() in KYC
   or KYT. Use wallet address hashing for score derivation.

5. Do not use any paid APIs. All external services are mocked.

6. The pre-flight check panel in the payment wizard is the
   #1 demo moment. It must be pixel-perfect and show individual
   pass/fail for every rule.

7. Write real error messages. Never use "Something went wrong."
   Always surface the actual rejection reason from the contract.
═══════════════════════════════════════════════════════════════════
```

---

A few notes on using this prompt effectively:

**For Claude Code** — paste it as the first message and follow up with "Start with Module 1" to keep it focused. Don't let it jump ahead.

**For Cursor** — drop it into a `.cursorrules` file at the root and open each module folder one at a time. Cursor works best with narrow scope per session.

**Hardest part** — the Anchor smart contract (Module 1) is where most AI agents struggle. If it gets stuck on PDA derivation or SPL token transfers, ask it specifically to reference the `@coral-xyz/anchor` docs pattern for token transfer CPIs.

**The pre-flight UI in Step 3.5** is your demo's money shot. If time is short, prioritise that above everything else in Module 3.