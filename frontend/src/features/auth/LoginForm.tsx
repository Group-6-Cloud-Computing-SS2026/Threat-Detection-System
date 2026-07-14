import type { SubmitEvent } from "react";
import Button from "../../shared/components/ui/Button.tsx";
const inputClass =
  "w-full rounded-xl border border-brand-carbon-black-700 bg-brand-carbon-black-950/90 px-3.5 py-2.5 text-brand-alabaster-grey-100 outline-none shadow-inner shadow-black/20 transition placeholder:text-brand-alabaster-grey-700 focus:border-brand-light-green-600 focus:ring-2 focus:ring-brand-light-green-600/20";
const labelClass = "text-sm font-medium text-brand-alabaster-grey-500";

type LoginFormProps = {
  username: string;
  password: string;
  isSubmitting: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export default function LoginForm({
  username,
  password,
  isSubmitting,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={onSubmit}
      aria-labelledby="auth-title-login"
      noValidate
    >
      <h2 id="auth-title-login" className="sr-only">
        Sign in
      </h2>

      <div className="grid gap-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Who are you?"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex h-2" />
      <Button type="submit" disabled={isSubmitting} fullWidth>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
