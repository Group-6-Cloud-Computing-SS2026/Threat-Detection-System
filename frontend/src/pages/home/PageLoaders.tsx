import type { ReactNode } from "react";

export function RoutePendingBar({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <div className="sticky top-0 z-20 h-[3px] overflow-hidden">
      <div className="bg-brand-light-green-500 shadow-brand-light-green-500/50 animate-route-bar absolute inset-y-0 w-2/5 rounded-full shadow-[0_0_8px]" />
    </div>
  );
}

export function PanelSkeleton({
  title,
  lines = 3,
  className = "",
}: {
  title?: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {title ? (
        <div className="mb-3 flex items-center gap-3">
          <div className="bg-brand-carbon-black-700 h-4 w-4 animate-pulse rounded-full" />
          <div className="text-brand-alabaster-grey-600 text-sm">{title}</div>
        </div>
      ) : null}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="bg-brand-carbon-black-700/80 h-4 animate-pulse rounded-full"
            style={{ width: `${92 - index * 18}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function FrameLoader({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <div className="border-brand-light-green-500/30 border-t-brand-light-green-500 h-10 w-10 animate-spin rounded-full border-4" />
      <div>
        <p className="text-brand-alabaster-grey-100 text-sm font-medium">
          {label}
        </p>
        {children ? (
          <p className="text-brand-alabaster-grey-600 mt-1 text-xs">
            {children}
          </p>
        ) : null}
      </div>
    </div>
  );
}
