import React from 'react';

// ─── Base skeleton block ─────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Full table loading skeleton ─────────────────────────────────────────────
// Renders `rows` skeleton rows with `cols` skeleton cells each.
export function TableSkeleton({
  rows = 8,
  cols = 7,
  showHeader = true,
}: {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {showHeader && (
        <div className="bg-gray-50 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1 max-w-[120px]" />
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-100 bg-white">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 flex-1 ${c === 0 ? 'max-w-[160px]' : c === cols - 1 ? 'max-w-[60px]' : 'max-w-[100px]'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card-level skeleton (single record or stats block) ──────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

// ─── Inline text skeleton (use in place of a single value) ───────────────────
export function TextSkeleton({ width = 'w-24' }: { width?: string }) {
  return <Skeleton className={`h-3 ${width} inline-block align-middle`} />;
}
