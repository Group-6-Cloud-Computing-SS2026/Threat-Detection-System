type MessageProps = {
  error: string | null;
  success: string | null;
};

export default function AuthMessages({ error, success }: MessageProps) {
  return (
    <div className="space-y-4" data-aos="fade-up" data-aos-delay={150}>
      {success && (
        <div
          className="border-brand-light-green-900/60 bg-brand-light-green-950/40 text-brand-light-green-200 my-6 rounded-xl border px-3 py-2 text-sm"
          role="status"
        >
          {success}
        </div>
      )}
      {error && (
        <div
          id="login-message"
          className="border-brand-brick-red-900/70 bg-brand-brick-red-950/45 text-brand-brick-red-100 my-6 rounded-xl border px-3 py-2 text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}
