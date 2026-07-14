import type { SubmitEvent } from "react";
import Button from "../../shared/components/ui/Button.tsx";
const inputClass =
  "w-full rounded-xl border border-brand-carbon-black-700 bg-brand-carbon-black-950/90 px-3.5 py-2.5 text-brand-alabaster-grey-100 outline-none shadow-inner shadow-black/20 transition placeholder:text-brand-alabaster-grey-700 focus:border-brand-light-green-600 focus:ring-2 focus:ring-brand-light-green-600/20";
const labelClass = "text-sm font-medium text-brand-alabaster-grey-500";

type RegisterFormProps = {
  username: string;
  email: string;
  password: string;
  role: string;
  isSubmitting: boolean;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export default function RegisterForm({
  username,
  email,
  password,
  role,
  isSubmitting,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
}: RegisterFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={onSubmit}
      aria-labelledby="auth-title-register"
      noValidate
    >
      <h2 id="auth-title-register" className="sr-only">
        Create account
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="reg-username" className={labelClass}>
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-email" className={labelClass}>
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-password" className={labelClass}>
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-role" className={labelClass}>
            Role
          </label>
          <select
            id="reg-role"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className={inputClass}
          >
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="flex h-2" />
      <Button type="submit" disabled={isSubmitting} fullWidth>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
