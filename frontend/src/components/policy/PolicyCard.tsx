import { Shield, CheckCircle, XCircle } from 'lucide-react';

export function PolicyCard({ policy }: { policy: any }) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-background rounded-lg border border-border mr-3">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">{policy.name}</h3>
            <p className="text-xs text-foreground/50 font-mono mt-1">{policy.pda || 'PDA_PENDING'}</p>
          </div>
        </div>
        {policy.isActive ? (
          <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3 mr-1" /> Active
          </span>
        ) : (
          <span className="flex items-center text-xs font-medium text-danger bg-danger/10 px-2 py-1 rounded-full">
            <XCircle className="w-3 h-3 mr-1" /> Inactive
          </span>
        )}
      </div>

      <div className="space-y-3 mt-6">
        <div className="flex justify-between text-sm">
          <span className="text-foreground/70">Allowed Jurisdictions</span>
          <span className="font-medium">{policy.allowedJurisdictions?.join(', ') || 'None'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground/70">Max Transfer Amount</span>
          <span className="font-medium">${((policy.maxTransferUsdCents || 0) / 100).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground/70">Min KYT Score</span>
          <span className="font-medium">{policy.minKytScore}/100</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground/70">Escrow Threshold</span>
          <span className="font-medium">{policy.escrowThreshold} txns</span>
        </div>
      </div>
    </div>
  );
}
