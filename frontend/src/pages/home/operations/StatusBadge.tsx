export default function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "connected" ||
    normalized === "healthy" ||
    normalized === "up" ||
    normalized === "online"
      ? "bg-brand-light-green-950 text-brand-light-green-300"
      : normalized === "degraded" || normalized === "maintenance"
        ? "bg-brand-brick-red-950/70 text-brand-brick-red-200"
        : "bg-brand-carbon-black-700 text-brand-alabaster-grey-400";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}>
      {status}
    </span>
  );
}

