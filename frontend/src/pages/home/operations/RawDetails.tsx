export default function RawDetails({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <details className="bg-brand-carbon-black-800/50 border-brand-carbon-black-700 overflow-hidden rounded-xl border">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-alabaster-grey-100">
        {label}
      </summary>
      <pre className="text-brand-alabaster-grey-200 border-brand-carbon-black-700 border-t overflow-auto p-4 text-xs leading-6 whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

