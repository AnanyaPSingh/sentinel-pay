'use client';

import { useState } from 'react';
import api from '@/lib/api';

const JURISDICTIONS = ['EU', 'US', 'UK', 'SG', 'IN', 'CH', 'AE'];

export function PolicyBuilder({ onPolicyCreated }: { onPolicyCreated: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jurisdictions: [] as string[],
    maxTransfer: 100000,
    minKyt: 50,
    escrowThreshold: 3,
  });

  const toggleJurisdiction = (j: string) => {
    setFormData(prev => ({
      ...prev,
      jurisdictions: prev.jurisdictions.includes(j)
        ? prev.jurisdictions.filter(x => x !== j)
        : [...prev.jurisdictions, j]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        institutionPda: 'mock_institution_pda',
        name: formData.name,
        allowedJurisdictions: formData.jurisdictions,
        maxTransferUsdCents: formData.maxTransfer * 100,
        minKytScore: formData.minKyt,
        escrowThreshold: formData.escrowThreshold,
      };

      const response = await api.post('/api/policy/create', payload);
      
      onPolicyCreated({
        ...payload,
        isActive: true,
        pda: response.data.policyPda || 'new_pda_' + Date.now(),
      });

      setFormData({
        name: '',
        jurisdictions: [],
        maxTransfer: 100000,
        minKyt: 50,
        escrowThreshold: 3,
      });
      alert('Policy created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create policy. ' + ((err as any)?.response?.data?.error || 'Check console.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-xl border border-border space-y-6">
      <h2 className="text-lg font-semibold">Create New Policy</h2>
      
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">Policy Name</label>
        <input 
          required
          type="text" 
          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent"
          placeholder="e.g. Cross-Border Export Policy"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">Allowed Jurisdictions</label>
        <div className="flex flex-wrap gap-2">
          {JURISDICTIONS.map(j => (
            <button
              key={j}
              type="button"
              onClick={() => toggleJurisdiction(j)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                formData.jurisdictions.includes(j) 
                  ? 'bg-accent/20 text-accent border-accent/50' 
                  : 'bg-background border-border text-foreground/70 hover:border-foreground/30'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Max Transfer (USD)</label>
          <input 
            required
            type="number" 
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent"
            value={formData.maxTransfer}
            onChange={e => setFormData({...formData, maxTransfer: Number(e.target.value)})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Escrow Threshold</label>
          <input 
            required
            type="number" 
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent"
            value={formData.escrowThreshold}
            onChange={e => setFormData({...formData, escrowThreshold: Number(e.target.value)})}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-foreground/70">Minimum KYT Score</label>
          <span className="text-accent font-medium">{formData.minKyt}</span>
        </div>
        <input 
          type="range" 
          min="0" max="100" 
          className="w-full accent-accent"
          value={formData.minKyt}
          onChange={e => setFormData({...formData, minKyt: Number(e.target.value)})}
        />
        <div className="flex justify-between text-xs text-foreground/50 mt-1">
          <span>0 (High Risk)</span>
          <span>100 (Clean)</span>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || formData.jurisdictions.length === 0}
        className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting to Solana...' : 'Create Policy on-chain'}
      </button>
    </form>
  );
}
