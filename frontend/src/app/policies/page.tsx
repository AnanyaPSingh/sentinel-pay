'use client';

import { useState, useEffect } from 'react';
import { PolicyBuilder } from '@/components/policy/PolicyBuilder';
import { PolicyCard } from '@/components/policy/PolicyCard';
import api from '@/lib/api';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([
    {
      name: "Cross-Border Export Policy",
      pda: "PoL1cy...xyz",
      allowedJurisdictions: ["EU", "US", "SG", "UK"],
      maxTransferUsdCents: 50000000,
      minKytScore: 50,
      escrowThreshold: 3,
      isActive: true
    }
  ]);

  useEffect(() => {
    api.get('/api/policy/mock_institution_pda')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setPolicies(res.data);
        }
      })
      .catch(err => console.error("Could not fetch policies", err));
  }, []);

  const handlePolicyCreated = (newPolicy: any) => {
    setPolicies([newPolicy, ...policies]);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-foreground">
      <div>
        <h1 className="text-2xl font-bold">Compliance Policies</h1>
        <p className="text-foreground/70 mt-1">Configure automated compliance rules enforced by the SentinelPay smart contract.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <PolicyBuilder onPolicyCreated={handlePolicyCreated} />
        </div>
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Active Policies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {policies.map((p, i) => (
              <PolicyCard key={i} policy={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
