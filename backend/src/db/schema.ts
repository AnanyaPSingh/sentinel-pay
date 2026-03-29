export const schemaSql = `
CREATE TABLE IF NOT EXISTS institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_pda TEXT UNIQUE NOT NULL,
  authority_wallet TEXT NOT NULL,
  name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  policy_count INTEGER NOT NULL DEFAULT 0,
  payment_count INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  institution_pda TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  kyc_verified INTEGER NOT NULL,
  kyc_expiry INTEGER NOT NULL,
  risk_tier INTEGER NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  is_sanctioned INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(institution_pda, wallet)
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_pda TEXT UNIQUE NOT NULL,
  institution_pda TEXT NOT NULL,
  policy_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  allowed_jurisdictions TEXT NOT NULL,
  max_transfer_usd_cents INTEGER NOT NULL,
  min_kyt_score INTEGER NOT NULL,
  escrow_threshold INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  rules_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_pda TEXT UNIQUE NOT NULL,
  institution_pda TEXT NOT NULL,
  sender_wallet TEXT NOT NULL,
  receiver_wallet TEXT NOT NULL,
  amount_usd_cents INTEGER NOT NULL,
  source_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  fx_rate_bps INTEGER NOT NULL,
  status TEXT NOT NULL,
  policy_id INTEGER NOT NULL,
  sender_vasp TEXT,
  receiver_vasp TEXT,
  reference TEXT,
  preflight_passed INTEGER NOT NULL,
  rejection_reason TEXT,
  created_at INTEGER NOT NULL,
  executed_at INTEGER,
  travel_rule_payload TEXT,
  autonomous_mode INTEGER NOT NULL DEFAULT 0,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER,
  event_type TEXT NOT NULL,
  actor TEXT,
  details TEXT,
  created_at INTEGER NOT NULL
);
`;
