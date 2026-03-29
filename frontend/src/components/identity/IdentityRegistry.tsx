'use client';

import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, AlertTriangle, Activity } from 'lucide-react';
import api from '@/lib/api';

const MOCK_IDENTITIES = [
  { wallet: "Alice123...", name: "Alice (ACME)", jurisdiction: "IN", kycStatus: "VERIFIED", expiry: "2027-03-30", riskTier: 0, txCount: 10, isSanctioned: false },
  { wallet: "Bob456...", name: "Bob (EuroCorp)", jurisdiction: "EU", kycStatus: "VERIFIED", expiry: "2026-12-15", riskTier: 0, txCount: 2, isSanctioned: false },
  { wallet: "Charlie789...", name: "Charlie (Anon)", jurisdiction: "US", kycStatus: "REJECTED", expiry: "N/A", riskTier: 2, txCount: 0, isSanctioned: true },
];

export function IdentityRegistry() {
  const [walletInput, setWalletInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [kycResult, setKycResult] = useState<any>(null);
  const [identities, setIdentities] = useState(MOCK_IDENTITIES);

  const handleKycCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletInput) return;
    
    setLoading(true);
    setKycResult(null);
    try {
      const response = await api.post('/api/identity/kyc', { wallet: walletInput, institutionPda: 'mock_pda' });
      setKycResult(response.data);
    } catch (err) {
      console.error(err);
      // Mock fallback
      const isHighRisk = walletInput.toLowerCase().includes('high') || walletInput.toLowerCase().includes('charlie');
      const dummyRes = {
        entityName: isHighRisk ? "Unknown Entity" : "New User " + walletInput.substring(0, 4),
        jurisdiction: isHighRisk ? "US" : "SG",
        kycStatus: isHighRisk ? "REJECTED" : "VERIFIED",
        expiry: "2027-01-01",
        riskTier: isHighRisk ? 2 : 0,
        transactionCount: 0,
        isSanctioned: isHighRisk
      };
      setKycResult(dummyRes);
      setIdentities([{ wallet: walletInput, name: dummyRes.entityName, jurisdiction: dummyRes.jurisdiction, kycStatus: dummyRes.kycStatus, expiry: dummyRes.expiry, riskTier: dummyRes.riskTier, txCount: 0, isSanctioned: dummyRes.isSanctioned }, ...identities]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search / Run KYC */}
      <div className="bg-surface p-6 rounded-xl border border-border">
        <h2 className="text-lg font-semibold mb-4">Register / Check Identity</h2>
        <form onSubmit={handleKycCheck} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Enter Wallet Address..." 
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Running KYC...' : 'Run KYC & Register'}
          </button>
        </form>

        {/* KYC Result Card */}
        {kycResult && (
          <div className="mt-6 p-6 rounded-xl border border-border bg-background flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{kycResult.entityName}</h3>
                  <p className="text-foreground/70 font-mono text-sm mt-1">{walletInput}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${kycResult.riskTier === 0 ? 'bg-success/10 text-success' : 
                    kycResult.riskTier === 1 ? 'bg-warning/10 text-warning' : 
                    'bg-danger/10 text-danger'}`}>
                  {kycResult.riskTier === 0 ? 'Low Risk' : kycResult.riskTier === 1 ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground/50 mb-1">Status</p>
                  <p className={`font-medium flex items-center ${kycResult.kycStatus === 'VERIFIED' ? 'text-success' : 'text-danger'}`}>
                    {kycResult.kycStatus === 'VERIFIED' ? <UserCheck className="w-4 h-4 mr-1" /> : <UserX className="w-4 h-4 mr-1" />}
                    {kycResult.kycStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/50 mb-1">Jurisdiction</p>
                  <p className="font-medium">{kycResult.jurisdiction}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/50 mb-1">Expiry Date</p>
                  <p className="font-medium">{kycResult.expiry}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/50 mb-1">Sanctions</p>
                  <p className={`font-medium flex items-center ${kycResult.isSanctioned ? 'text-danger' : 'text-success'}`}>
                    {kycResult.isSanctioned ? 'Flagged' : 'Clear'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-32 lg:w-48 bg-surface p-4 rounded-lg border border-border text-center flex flex-col justify-center items-center h-full">
              <Activity className="w-8 h-8 text-accent mb-2" />
              <p className="text-2xl font-bold">{kycResult.transactionCount}</p>
              <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 text-center">Prior Txns</p>
            </div>
          </div>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">Registered Identities</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background/50 text-foreground/70 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Entity / Wallet</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Jurisdiction</th>
                <th className="px-6 py-3 font-medium">KYC Status</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Risk Tier</th>
                <th className="px-6 py-3 font-medium text-right">Txns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {identities.map((id, i) => (
                <tr key={i} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{id.name}</p>
                    <p className="text-xs font-mono text-foreground/50 mt-1">{id.wallet}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">{id.jurisdiction}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-xs font-medium ${id.kycStatus === 'VERIFIED' ? 'text-success' : 'text-danger'}`}>
                      {id.kycStatus === 'VERIFIED' ? <UserCheck className="w-3 h-3 mr-1"/> : <UserX className="w-3 h-3 mr-1"/>}
                      {id.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium 
                      ${id.riskTier === 0 ? 'bg-success/10 text-success' : 
                        id.riskTier === 1 ? 'bg-warning/10 text-warning' : 
                        'bg-danger/10 text-danger'}`}>
                      {id.riskTier === 0 ? 'Low' : id.riskTier === 1 ? 'Medium' : 'High'}
                    </span>
                    {id.isSanctioned && <AlertTriangle className="inline w-4 h-4 text-danger ml-2" />}
                  </td>
                  <td className="px-6 py-4 text-foreground/70 text-right">{id.txCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
