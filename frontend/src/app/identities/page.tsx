import { IdentityRegistry } from '@/components/identity/IdentityRegistry';

export default function IdentitiesPage() {
  return (
    <div className="max-w-6xl mx-auto text-foreground">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Identity Management</h1>
        <p className="text-foreground/70 mt-1">Register counterparties and manage KYC / compliance data.</p>
      </div>
      <IdentityRegistry />
    </div>
  );
}
