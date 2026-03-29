import { PaymentWizard } from '@/components/payment/PaymentWizard';

export default function PaymentsPage() {
  return (
    <div className="w-full text-foreground">
      <div className="mb-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Initiate Payment</h1>
        <p className="text-foreground/70 mt-1">Orchestrate cross-border flows with on-chain compliance validation.</p>
      </div>
      <PaymentWizard />
    </div>
  );
}
