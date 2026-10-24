// src/components/ui/StatCard.tsx
// Reusable KPI card for Hotel De Port Harcourt admin operations

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  onClick,
  highlight = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white border transition-all duration-200 ${
        highlight
          ? 'border-[#C9A24B] shadow-md ring-1 ring-[#C9A24B]/30'
          : 'border-slate-200/80 shadow-xs hover:border-[#C9A24B]/60 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#0A1A2F] tracking-tight">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#0A1A2F]/5 text-[#C9A24B] border border-[#C9A24B]/20 shrink-0">
          <Icon className="w-6 h-6 text-[#C9A24B]" />
        </div>
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.value}
              </span>
            )}
            <span className="truncate">{subtitle}</span>
          </div>

          {badge && (
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0A1A2F]/5 text-[#0A1A2F]">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
