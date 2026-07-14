import { homePanelClass } from "../homeSurface.ts";

export default function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={`${homePanelClass} p-4`}>
      <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.18em] uppercase">
        {label}
      </div>
      <div className="text-brand-alabaster-grey-100 mt-1 text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-brand-alabaster-grey-600 mt-1 text-xs">{detail}</div>
    </div>
  );
}
