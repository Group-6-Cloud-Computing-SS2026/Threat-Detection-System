export default function LevelBadge({ level }: { level: string }) {
  const key = level.toUpperCase();
  const className =
    key === "ERROR" || key === "CRITICAL"
      ? "bg-brand-brick-red-950 text-brand-brick-red-300"
      : key === "WARNING"
        ? "bg-brand-brick-red-950/70 text-brand-brick-red-200"
        : key === "INFO"
          ? "bg-brand-light-green-950 text-brand-light-green-300"
          : "bg-brand-carbon-black-700 text-brand-alabaster-grey-400";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}>
      {key}
    </span>
  );
}

