'use client';

import { DollarSign, Ban, Clock, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const volumeData = [
  { name: 'Mon', volume: 400000 },
  { name: 'Tue', volume: 300000 },
  { name: 'Wed', volume: 550000 },
  { name: 'Thu', volume: 450000 },
  { name: 'Fri', volume: 700000 },
  { name: 'Sat', volume: 200000 },
  { name: 'Sun', volume: 350000 },
];

const statusData = [
  { name: 'Pending', count: 12 },
  { name: 'Executed', count: 85 },
  { name: 'Rejected', count: 8 },
  { name: 'Escrow', count: 5 },
];

const recentPayments = [
  { id: 'PAY-1001', sender: 'Alice (ACME)', receiver: 'Bob (EuroCorp)', amount: '$45,000', status: 'Executed', time: '5 mins ago' },
  { id: 'PAY-1002', sender: 'Alice (ACME)', receiver: 'Charlie (Anon)', amount: '$10,000', status: 'Rejected', time: '1 hour ago' },
  { id: 'PAY-1003', sender: 'Alice (ACME)', receiver: 'David (SG Traders)', amount: '$120,000', status: 'In Escrow', time: '2 hours ago' },
  { id: 'PAY-1004', sender: 'Eve (Global)', receiver: 'Alice (ACME)', amount: '$5,500', status: 'Executed', time: '3 hours ago' },
  { id: 'PAY-1005', sender: 'Alice (ACME)', receiver: 'Bob (EuroCorp)', amount: '$600,000', status: 'Rejected', time: '1 day ago' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-foreground/70">Monitor treasury operations and autonomous execution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Volume (7d)" value="$2.95M" icon={DollarSign} trend="+12.5%" />
        <StatCard title="Payments Executed" value="85" icon={Activity} trend="+4.2%" />
        <StatCard title="Blocked Payments" value="8" icon={Ban} trend="-2.1%" />
        <StatCard title="Avg Settlement" value="0.8s" icon={Clock} trend="-0.1s" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Payment Volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" />
                <XAxis dataKey="name" stroke="#F1F5F9" opacity={0.5} />
                <YAxis stroke="#F1F5F9" opacity={0.5} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2E3347' }} />
                <Line type="monotone" dataKey="volume" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Payment Status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" />
                <XAxis dataKey="name" stroke="#F1F5F9" opacity={0.5} />
                <YAxis stroke="#F1F5F9" opacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2E3347', color: '#F1F5F9' }} cursor={{fill: '#2E3347', opacity: 0.4}} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Recent Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background/50 text-foreground/70 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Payment ID</th>
                <th className="px-6 py-3 font-medium">Sender</th>
                <th className="px-6 py-3 font-medium">Receiver</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {recentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-accent">{payment.id}</td>
                  <td className="px-6 py-4">{payment.sender}</td>
                  <td className="px-6 py-4">{payment.receiver}</td>
                  <td className="px-6 py-4 font-medium">{payment.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium 
                      ${payment.status === 'Executed' ? 'bg-success/10 text-success' : 
                        payment.status === 'Rejected' ? 'bg-danger/10 text-danger' : 
                        'bg-warning/10 text-warning'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground/70">{payment.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-surface p-6 rounded-xl border border-border flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-background rounded-lg border border-border">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-foreground/70 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
