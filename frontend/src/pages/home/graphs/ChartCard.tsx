import type { RefObject } from "react";
import { homePanelClass } from "../homeSurface.ts";

export default function ChartCard({
  title,
  subtitle,
  badgeText,
  badgeClassName,
  canvasRef,
  isReady,
  error,
}: {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeClassName: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isReady: boolean;
  error: string | null;
}) {
  return (
    <article className={`${homePanelClass} p-4 md:p-5`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-brand-alabaster-grey-100 text-lg font-semibold">
            {title}
          </h2>
          <p className="text-brand-alabaster-grey-600 text-sm">{subtitle}</p>
        </div>
        <span
          className={`self-start rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClassName}`}
        >
          {badgeText}
        </span>
      </div>

      <div className="relative h-80">
        {!isReady ? (
          <div className="bg-brand-pitch-black-500/95 absolute inset-0 grid place-items-center rounded-xl">
            <div className="text-brand-alabaster-grey-600 text-sm">
              Loading Chart.js...
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="bg-brand-brick-red-950 text-brand-brick-red-300 absolute inset-x-0 top-0 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}
        <canvas ref={canvasRef} />
      </div>
    </article>
  );
}
