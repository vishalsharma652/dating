import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  change?: string;
}

export function StatCard({ label, value, icon: Icon, trend, change }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
          <Icon className="text-pink-500" size={24} />
        </div>
      </div>
      {change && (
        <p
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {trend === 'up' ? '↑' : '↓'} {change}
        </p>
      )}
    </Card>
  );
}
