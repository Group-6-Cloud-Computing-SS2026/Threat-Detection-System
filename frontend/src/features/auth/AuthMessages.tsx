type MessageProps = {
  error: string | null;
  success: string | null;
};

export default function AuthMessages({ error, success }: MessageProps) {
  return (
    <div className="space-y-4">
      {success && (
        <div
          className="rounded-xl border border-brand-light-green-900/60 bg-brand-light-green-950/40 px-3 py-2 text-sm text-brand-light-green-200"
          role="status"
        >
          {success}
        </div>
      )}
      {error && (
        <div
          id="login-message"
          className="rounded-xl border border-brand-brick-red-900/70 bg-brand-brick-red-950/45 px-3 py-2 text-sm text-brand-brick-red-100"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}
