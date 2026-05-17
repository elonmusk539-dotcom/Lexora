'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: PaginationProps) {
  const itemsPerPageOptions = [10, 25, 50, 100];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= showPages; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-3 sm:p-4 rounded-2xl glass border border-[var(--color-border)] shadow-sm">
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-[var(--color-text-muted)] font-medium">Show</span>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1.5 pl-3 pr-8 text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent transition-all cursor-pointer"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-text-muted)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        <span className="text-[var(--color-text-muted)] font-medium">
          of {totalItems}
        </span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* First page (Hidden on mobile) */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <span key={index}>
              {page === '...' ? (
                <span className="px-1 sm:px-2 text-[var(--color-text-muted)] text-sm sm:text-base font-medium">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-sm sm:text-base font-bold transition-all active:scale-95 ${currentPage === page
                    ? 'bg-gradient-to-br from-ocean-500 to-ocean-600 text-white shadow-md shadow-ocean-500/30'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]'
                    }`}
                >
                  {page}
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Last page (Hidden on mobile) */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
