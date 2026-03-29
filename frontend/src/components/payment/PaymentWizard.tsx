'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, XCircle, Loader2, Clock } from 'lucide-react';

const MOCK_IDENTITIES = [
  "Alice (ACME)", "Bob (EuroCorp)", "Charlie (Anon)", "David (SG Traders)"
];

const MOCK_POLICIES = [
  { id: "1", name: "Cross-Border Export Policy" },
  { id: "2", name: "Internal Transfer Policy" }
];

export function PaymentWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sender: '', receiver: '', amount: '', sourceCurrency: 'USD', targetCurrency: 'EUR', policyId: '', memo: ''
  });
  
  const [preflightData, setPreflightData] = useState<any>(null);
  const [executionStatus, setExecutionStatus] = useState<string>('');
  
  const handlePreflight = async () => {
    setLoading(true);
    try {
      const isHighRisk = formData.receiver === 'Charlie (Anon)';
      const isOverLimit = Number(formData.amount) > 1000000;
      const isEscrow = formData.receiver === 'Bob (EuroCorp)';

      const mockResult = {
        passed: !isHighRisk && !isOverLimit,
        checks: [
          { name: 'Sender KYC Verified', passed: true, reason: 'Valid until Dec 2026' },
          { name: 'Receiver KYC Verified', passed: !isHighRisk, reason: isHighRisk ? 'KYC Rejected' : 'Valid until Mar 2027' },
          { name: 'Sanctions Check Clear', passed: !isHighRisk, reason: isHighRisk ? 'Flagged on OFAC' : 'Both parties clean' },
          { name: 'Jurisdiction Allowed', passed: true, reason: 'IN → EU allowed by policy' },
          { name: 'KYT Score: 62/100', passed: true, reason: 'Medium risk' + (isEscrow ? ', escrow required' : ''), warning: isEscrow },
          { name: 'Amount Within Limit', passed: !isOverLimit, reason: !isOverLimit ? `$${formData.amount} < $1,000,000` : `Exceeds max transfer limit` },
          { name: 'Travel Rule Payload Ready', passed: true, reason: 'FATF compliant' }
        ],
        requiresEscrow: isEscrow && !isHighRisk && !isOverLimit,
        suggestedAction: (isHighRisk || isOverLimit) ? 'BLOCK' : (isEscrow ? 'ESCROW' : 'EXECUTE'),
      };

      setTimeout(() => {
        setPreflightData(mockResult);
        setStep(2);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleExecute = () => {
    setLoading(true);
    setTimeout(() => {
      setExecutionStatus(preflightData.suggestedAction === 'ESCROW' ? 'InEscrow' : 'Executed');
      setStep(4);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-foreground">
      {/* Step Indicator */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border">
        {[
          { num: 1, label: 'Details' }, 
          { num: 2, label: 'Pre-flight' }, 
          { num: 3, label: 'FX Route' }, 
          { num: 4, label: 'Execute' }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors duration-300
              ${step >= s.num ? 'bg-accent text-white' : 'bg-background border border-border text-foreground/40'}`}>
              {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
            </div>
            <span className={`text-xs font-medium uppercase tracking-wider ${step >= s.num ? 'text-accent' : 'text-foreground/40'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <form className="bg-surface p-8 rounded-xl border border-border space-y-6" onSubmit={(e) => { e.preventDefault(); handlePreflight(); }}>
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Sender</label>
              <select required className="w-full bg-background border border-border rounded-lg px-4 py-3" value={formData.sender} onChange={e => setFormData({...formData, sender: e.target.value})}>
                <option value="">Select identity...</option>
                {MOCK_IDENTITIES.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Receiver</label>
              <select required className="w-full bg-background border border-border rounded-lg px-4 py-3" value={formData.receiver} onChange={e => setFormData({...formData, receiver: e.target.value})}>
                <option value="">Select identity...</option>
                {MOCK_IDENTITIES.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground/70 mb-2">Amount</label>
                <input required type="number" placeholder="100000" className="w-full bg-background border border-border rounded-lg px-4 py-3" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-foreground/70 mb-2">Source</label>
                <select className="w-full bg-background border border-border rounded-lg px-2 py-3" value={formData.sourceCurrency} onChange={e => setFormData({...formData, sourceCurrency: e.target.value})}>
                  <option>USD</option><option>EUR</option><option>INR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Target Currency</label>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-3" value={formData.targetCurrency} onChange={e => setFormData({...formData, targetCurrency: e.target.value})}>
                <option>EUR</option><option>USD</option><option>INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Policy Constraint</label>
              <select required className="w-full bg-background border border-border rounded-lg px-4 py-3" value={formData.policyId} onChange={e => setFormData({...formData, policyId: e.target.value})}>
                <option value="">Select policy...</option>
                {MOCK_POLICIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Invoice / Memo</label>
              <input required type="text" placeholder="INV-2026-001" className="w-full bg-background border border-border rounded-lg px-4 py-3" value={formData.memo} onChange={e => setFormData({...formData, memo: e.target.value})} />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors flex items-center">
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Run Pre-flight Check <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && preflightData && (
        <div className={`p-8 rounded-xl border ${preflightData.passed ? 'bg-surface border-border' : 'bg-danger/5 border-danger/30'}`}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            {preflightData.passed ? "Pre-flight Check Results" : <><AlertTriangle className="text-danger mr-2" /> TRANSACTION BLOCKED</>}
          </h2>
          <div className="space-y-4 font-mono text-sm bg-background/50 p-6 rounded-lg border border-border">
            {preflightData.checks.map((chk: any, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row sm:justify-between border-b last:border-0 border-border/50 pb-2 last:pb-0 gap-1">
                <span className="flex items-center sm:w-2/3">
                  {chk.passed && !chk.warning ? <CheckCircle className="w-4 h-4 text-success mr-3 shrink-0" /> : 
                   chk.warning ? <AlertTriangle className="w-4 h-4 text-warning mr-3 shrink-0" /> : 
                   <XCircle className="w-4 h-4 text-danger mr-3 shrink-0" />}
                  <span className={!chk.passed ? 'text-danger font-bold' : ''}>{chk.name}</span>
                </span>
                <span className="sm:w-1/3 sm:text-right opacity-70 ml-7 sm:ml-0 truncate">{chk.reason}</span>
              </div>
            ))}
            <div className={`mt-6 pt-4 border-t border-border font-bold text-center tracking-widest text-lg
              ${preflightData.suggestedAction === 'BLOCK' ? 'text-danger' : 
                preflightData.suggestedAction === 'ESCROW' ? 'text-warning' : 'text-success'}`}>
              VERDICT: {preflightData.suggestedAction === 'ESCROW' ? 'PROCEED WITH ESCROW' : 
                        preflightData.suggestedAction === 'BLOCK' ? 'TRANSACTION REJECTED' : 'CLEARED FOR EXECUTION'}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(1)} className="px-6 py-2 border border-border rounded-lg hover:bg-background transition-colors">Back</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={!preflightData.passed}
              className="px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue to FX Preview
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="bg-surface p-8 rounded-xl border border-border">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">FX Route Preview</h2>
          <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-background border border-border rounded-xl gap-6">
            <div className="text-center w-full md:w-auto">
              <p className="text-foreground/50 text-sm mb-1">{formData.sourceCurrency}</p>
              <p className="text-3xl font-bold">{formData.amount}</p>
            </div>
            <div className="flex flex-col items-center flex-1 px-8">
              <div className="flex items-center text-accent mb-2 w-full justify-center">
                <span className="flex-1 h-px bg-accent/50 max-w-[100px]" />
                <ArrowRight className="mx-4" />
                <span className="flex-1 h-px bg-accent/50 max-w-[100px]" />
              </div>
              <p className="text-xs font-mono bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20 whitespace-nowrap">
                Rate: 1 {formData.sourceCurrency} = {(formData.sourceCurrency === 'USD' && formData.targetCurrency === 'EUR') ? '0.92' : '1.08'} {formData.targetCurrency}
              </p>
              <p className="text-xs text-foreground/50 mt-2 text-center">Via bridge: USDC</p>
            </div>
            <div className="text-center w-full md:w-auto">
              <p className="text-foreground/50 text-sm mb-1">{formData.targetCurrency}</p>
              <p className="text-3xl font-bold text-success">
                {(Number(formData.amount) * ((formData.sourceCurrency === 'USD' && formData.targetCurrency === 'EUR') ? 0.92 : 1.08)).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-medium mt-6 p-4 border border-border rounded-lg">
            <span>Estimated Network & FX Fees</span>
            <span className="text-danger">~ $1.42 (0.01%)</span>
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2 border border-border rounded-lg hover:bg-background transition-colors">Back</button>
            <button 
              onClick={handleExecute} 
              disabled={loading}
              className="px-8 py-3 bg-success hover:bg-success/90 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
              Confirm & Submit to Chain
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="bg-surface p-8 rounded-xl border border-border text-center">
          <div className="flex justify-center mb-6">
            {executionStatus === 'InEscrow' ? (
              <div className="p-4 bg-warning/10 rounded-full text-warning border border-warning/20">
                <Clock className="w-12 h-12" />
              </div>
            ) : (
              <div className="p-4 bg-success/10 rounded-full text-success border border-success/20">
                <CheckCircle className="w-12 h-12" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {executionStatus === 'InEscrow' ? 'Payment Escrowed' : 'Payment Executed'}
          </h2>
          <p className="text-foreground/70 max-w-md mx-auto mb-8">
            {executionStatus === 'InEscrow' 
              ? 'Transaction successfully submitted but routed to smart contract escrow due to policy constraints.' 
              : 'Transaction instantly settled on Solana with pre-flight compliance checks completed and enforced.'}
          </p>

          <div className="bg-background border border-border rounded-lg p-6 max-w-xl mx-auto text-left mb-8 space-y-4">
            <div className="flex justify-between">
              <span className="text-foreground/50">Transaction Hash</span>
              <span className="font-mono text-accent">5GqY...4mKp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Status</span>
              <span className={`font-mono font-medium ${executionStatus === 'InEscrow' ? 'text-warning' : 'text-success'}`}>{executionStatus}</span>
            </div>
            <details className="mt-4 pt-4 border-t border-border">
              <summary className="cursor-pointer font-medium text-sm outline-none">View Travel Rule Payload (FATF)</summary>
              <pre className="mt-4 p-4 bg-[#0a0a0a] rounded border border-border text-xs text-foreground/80 overflow-auto">
{`{
  "transactionId": "5GqY...4mKp",
  "originatingVasp": {
    "name": "SentinelPay Prime",
    "lei": "894500L9W0312BD39G48",
    "jurisdiction": "SG"
  },
  "beneficiaryVasp": {
    "name": "SentinelPay Europe",
    "lei": "213800XYZ87ABCDE1234",
    "jurisdiction": "EU"
  },
  "originator": {
    "name": "${formData.sender}",
    "walletAddress": "4zMMC9srt5Ri5X14GAgXhaHii..."
  },
  "beneficiary": {
    "name": "${formData.receiver}",
    "walletAddress": "7dXXC9srt5Ri5X14GAgXhaHii..."
  },
  "transferAmount": ${formData.amount},
  "currency": "${formData.sourceCurrency}",
  "timestamp": "${new Date().toISOString()}",
  "signature": "ab82c9f...892cc"
}`}
              </pre>
            </details>
          </div>

          <button onClick={() => { setStep(1); setFormData({...formData, amount: '', memo: ''}); }} className="px-6 py-2 border border-border rounded-lg hover:bg-background transition-colors">
            Start New Transfer
          </button>
        </div>
      )}
    </div>
  );
}
