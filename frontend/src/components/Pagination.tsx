import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalElements?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {totalElements !== undefined && (
        <span className="text-sm text-slate-500">
          Page <span className="font-semibold text-slate-800">{currentPage + 1}</span> sur{' '}
          <span className="font-semibold text-slate-800">{totalPages}</span> ({totalElements} éléments)
        </span>
      )}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          // Show only surrounding pages if many
          if (totalPages > 7) {
            if (
              idx !== 0 &&
              idx !== totalPages - 1 &&
              Math.abs(idx - currentPage) > 2
            ) {
              if (idx === 1 || idx === totalPages - 2) {
                return (
                  <span key={idx} className="px-2 text-slate-400">
                    ...
                  </span>
                );
              }
              return null;
            }
          }

          const isActive = idx === currentPage;
          return (
            <button
              key={idx}
              onClick={() => onPageChange(idx)}
              className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
