'use client';

import { Power } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

export function Header() {
  const [isAutonomous, setIsAutonomous] = useState(false);

  const toggleAutonomous = async () => {
    try {
      const newState = !isAutonomous;
      await api.post('/api/autonomous/toggle', { institutionPda: 'mock_pda', enabled: newState });
      setIsAutonomous(newState);
    } catch (e) {
      console.error('Failed to toggle autonomous mode', e);
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <div className="flex-1">
        {isAutonomous ? (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></span>
            AUTONOMOUS MODE ACTIVE — System is auto-executing compliant payments
          </div>
        ) : (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-border text-foreground/70 text-sm font-medium">
            MANUAL MODE — Payments require approval
          </div>
        )}
      </div>
      <div>
        <button
          onClick={toggleAutonomous}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
            isAutonomous 
              ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20' 
              : 'bg-success/10 text-success border-success/20 hover:bg-success/20'
          }`}
        >
          <Power className="mr-2 h-4 w-4" />
          {isAutonomous ? 'Disable Autonomous' : 'Enable Autonomous'}
        </button>
      </div>
    </header>
  );
}
