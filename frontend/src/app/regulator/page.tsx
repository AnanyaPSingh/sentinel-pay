'use client';

import { ShieldAlert, Download, Search, FileText, AlertTriangle } from 'lucide-react';

export default function RegulatorView() {
  return (
    <div className="space-y-8 text-foreground max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-danger/5 border border-danger/20 p-6 rounded-xl">
        <div>
          <div className="flex items-center text-danger font-bold mb-2 tracking-widest uppercase text-sm">
            <ShieldAlert className="mr-2 w-5 h-5" />
            Regulator Mode
          </div>
          <h1 className="text-2xl font-bold">SentinelPay Global Compliance</h1>
          <p className="text-foreground/70 mt-1">Read-only institutional access to identity networks and audit trails.</p>
        </div>
        <button className="flex items-center px-4 py-2 border border-danger/30 rounded-lg text-sm bg-danger/10 text-danger hover:bg-danger/20 transition-colors font-medium whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" /> Printable Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Graph Mock using SVG */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Identity Map & Fund Flows</h2>
            <div className="w-full h-80 bg-background rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 600 300" className="max-w-full">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366F1" opacity="0.5" />
                  </marker>
                </defs>
                <line x1="150" y1="150" x2="300" y2="100" stroke="#6366F1" strokeWidth="2" opacity="0.5" markerEnd="url(#arrow)" />
                <line x1="300" y1="100" x2="450" y2="150" stroke="#6366F1" strokeWidth="2" opacity="0.5" markerEnd="url(#arrow)" />
                <line x1="150" y1="150" x2="400" y2="220" stroke="#EF4444" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrow)" />
                
                {/* Nodes */}
                <g transform="translate(150, 150)">
                  <circle r="30" fill="#1A1D27" stroke="#10B981" strokeWidth="2"/>
                  <text x="0" y="50" fill="#F1F5F9" fontSize="12" textAnchor="middle">Alice (IN)</text>
                  <text x="0" y="5" fill="#10B981" fontSize="10" textAnchor="middle" fontWeight="bold">LOW</text>
                </g>
                <g transform="translate(300, 100)">
                  <circle r="30" fill="#1A1D27" stroke="#10B981" strokeWidth="2"/>
                  <text x="0" y="50" fill="#F1F5F9" fontSize="12" textAnchor="middle">Bob (EU)</text>
                  <text x="0" y="5" fill="#10B981" fontSize="10" textAnchor="middle" fontWeight="bold">LOW</text>
                </g>
                <g transform="translate(450, 150)">
                  <circle r="30" fill="#1A1D27" stroke="#F59E0B" strokeWidth="2"/>
                  <text x="0" y="50" fill="#F1F5F9" fontSize="12" textAnchor="middle">Charlie (SG)</text>
                  <text x="0" y="5" fill="#F59E0B" fontSize="10" textAnchor="middle" fontWeight="bold">MED</text>
                </g>
                <g transform="translate(400, 220)">
                  <circle r="30" fill="#1A1D27" stroke="#EF4444" strokeWidth="3"/>
                  <text x="0" y="50" fill="#F1F5F9" fontSize="12" textAnchor="middle">Unknown (High Risk)</text>
                  <text x="0" y="5" fill="#EF4444" fontSize="10" textAnchor="middle" fontWeight="bold">HIGH</text>
                </g>

                {/* Flow Labels */}
                <text x="215" y="115" fill="#F1F5F9" fontSize="10" opacity="0.7">$45k</text>
                <text x="240" y="195" fill="#EF4444" fontSize="10" opacity="0.9">Blocked: $10k</text>
              </svg>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-foreground/50 justify-center">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full border border-success mr-2"></span> Low Risk</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full border border-warning mr-2"></span> Medium Risk</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full border-2 border-danger mr-2"></span> High Risk</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-danger flex items-center">
              <AlertTriangle className="mr-2 w-5 h-5" /> Suspicious Activity Flags
            </h2>
            <div className="space-y-4">
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <h3 className="font-bold text-danger">Blocked Transfer: Sent to Sanctioned Entity</h3>
                  <p className="text-sm mt-1">Alice attempted to send $10,000 to flagged address. KYT Score: 12/100</p>
                  <p className="text-xs font-mono mt-2 text-foreground/50">TxRef: BLK-SYS-001 • Today 09:22 AM</p>
                </div>
                <button className="px-3 py-1 bg-surface border border-danger/30 text-danger text-xs rounded hover:bg-danger/5 transition-colors whitespace-nowrap">Investigate</button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Source of Funds Trace</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 w-4 h-4" />
              <input type="text" placeholder="Wallet Address..." className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="text-center p-6 bg-background rounded-lg border border-border border-dashed">
              <ShieldAlert className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-foreground/50">Enter a wallet to trace fund origins</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="mr-2 w-5 h-5 text-accent" /> FATF Travel Rule Payloads
            </h2>
            <div className="space-y-3">
              {[1001, 1004].map(id => (
                <div key={id} className="p-3 bg-background rounded-lg border border-border hover:border-accent/50 cursor-pointer transition-colors group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-sm group-hover:text-accent">PAY-{id}</span>
                    <span className="text-xs text-foreground/50">Today</span>
                  </div>
                  <p className="text-xs text-foreground/70 truncate">Originating: SentinelPay Prime SG</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
