import type { AuthMode as Mode } from "../../shared/types";

type HeaderProps = {
  mode: Mode;
};

export default function AuthHeader({ mode }: HeaderProps) {
  return (
    <div className="motion-safe:animate-auth-fade mb-6 max-w-xl">
      <p className="text-brand-light-green-300 text-sm font-medium tracking-wide uppercase">
        {mode === "register" ? "Create account" : "Welcome back"}
      </p>
      <h1 className="text-brand-alabaster-grey-50 mt-2 text-3xl leading-tight font-semibold sm:text-4xl">
        {mode === "register"
          ? "Register a new operator"
          : "Sign in to your dashboard"}
      </h1>
      <p className="text-brand-alabaster-grey-600 mt-2 max-w-2xl text-sm leading-6 sm:text-base">
        {mode === "register"
          ? "Create an account with a role that matches your access level."
          : "Use your credentials to open the monitoring console."}
      </p>
    </div>
  );
}
