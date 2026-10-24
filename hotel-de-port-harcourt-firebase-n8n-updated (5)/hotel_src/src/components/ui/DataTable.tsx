// src/components/ui/DataTable.tsx
// Responsive, accessible data table with search, loading skeleton, and empty states

import React, { useState, useMemo } from 'react';
import { Search, X, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
  rowKey: (item: T) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchFilter,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items to display matching your criteria.',
  actions,
  rowKey
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter(item => searchFilter(item, q));
  }, [data, searchQuery, searchFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Bar with Search and Action Buttons */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600 border-collapse">
          <thead className="bg-[#0A1A2F]/5 text-[#0A1A2F] text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3.5 whitespace-nowrap font-semibold ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-cell-${cIdx}`} className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-slate-200 rounded w-24 max-w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-[#0A1A2F]">{emptyTitle}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{emptyMessage}</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-3 text-xs text-[#C9A24B] hover:underline font-medium"
                      >
                        Reset search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Real data rows
              filteredData.map((item, index) => (
                <tr
                  key={rowKey(item)}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 whitespace-nowrap align-middle ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, index)
                        : (item as any)[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Showing <span className="font-semibold text-slate-700">{filteredData.length}</span> of{' '}
          <span className="font-semibold text-slate-700">{data.length}</span> records
        </span>
        {searchQuery && (
          <span className="text-amber-600 font-medium">
            Filtered by &quot;{searchQuery}&quot;
          </span>
        )}
      </div>
    </div>
  );
}
