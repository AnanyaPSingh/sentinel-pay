import Link from 'next/link';
import { Home, Shield, Users, ArrowRightLeft, List, Eye } from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Policies', href: '/policies', icon: Shield },
  { name: 'Identities', href: '/identities', icon: Users },
  { name: 'Payments', href: '/payments', icon: ArrowRightLeft },
  { name: 'Audit Trail', href: '/audit', icon: List },
  { name: 'Regulator View', href: '/regulator', icon: Eye },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-surface border-r border-border h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center text-foreground">
          <Shield className="mr-2 text-accent" />
          SentinelPay
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-foreground hover:bg-background transition-colors"
          >
            <item.icon className="mr-3 h-5 w-5 text-accent" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
