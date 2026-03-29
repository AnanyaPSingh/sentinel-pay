'use client';

import { useState } from 'react';
import { Search, Download, Filter, FileText } from 'lucide-react';

const MOCK_EVENTS = [
  { id: 'EVT-001', time: '2026-03-30 09:15:22', type: 'PAYMENT_CREATED', actor: 'Alice (ACME)', details: 'Payment PAY-1001 initialized' },
  { id: 'EVT-002', time: '2026-03-30 09:15:23', type: 'PREFLIGHT_PASSED', actor: 'System', details: 'All compliance checks passed for PAY-1001' },
  { id: 'EVT-003', time: '2026-03-30 09:15:25', type: 'FUNDS_LOCKED', actor: 'Authority', details: 'Funds secured in escrow wrapper' },
  { id: 'EVT-004', time: '2026-03-30 09:15:28', type: 'PAYMENT_EXECUTED', actor: 'System', details: 'Settled to receiver on Solana via USDC bridge' },
];

export default function AuditTrailPage() {
  return (
    <div className="space-y-8 text-foreground max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-foreground/70 mt-1">Immutable ledger of all system events and transactions.</p>
        </div>
        <button className="flex items-center px-4 py-2 border border-border rounded-lg text-sm bg-surface hover:bg-background transition-colors whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Payment ID, Actor..." 
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-accent font-mono text-sm"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground/80 outline-none w-full md:w-48">
            <option>All Events</option>
            <option>PAYMENT_CREATED</option>
            <option>PREFLIGHT_PASSED</option>
            <option>PREFLIGHT_FAILED</option>
          </select>
          <button className="px-4 py-2 border border-border rounded-lg bg-background hover:bg-surface flex items-center shrink-0 text-sm">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </button>
        </div>
      </div>

      <div className="relative border-l-2 border-border ml-6 space-y-8 py-4">
        {MOCK_EVENTS.map((evt, i) => (
          <div key={i} className="relative pl-8">
            <div className="absolute w-4 h-4 bg-accent rounded-full -left-[9px] top-1 border-4 border-background" />
            <div className="bg-surface p-5 rounded-xl border border-border">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                <div className="flex items-center">
                  <span className="font-mono text-xs text-foreground/50 mr-4 whitespace-nowrap">{evt.time}</span>
                  <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-bold rounded">{evt.type}</span>
                </div>
                <span className="font-mono text-xs text-foreground/50">ID: {evt.id}</span>
              </div>
              <p className="text-foreground mt-2">{evt.details}</p>
              <div className="mt-3 pt-3 border-t border-border flex items-center text-sm">
                <span className="text-foreground/50 mr-2">Actor:</span>
                <span className="font-medium">{evt.actor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
