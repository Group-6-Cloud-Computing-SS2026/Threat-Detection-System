import type { AuthMode as Mode } from "../../shared/types";

type ModeToggleProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="bg-brand-carbon-black-800 border-brand-carbon-black-700 mb-6 flex rounded-xl border p-1 text-sm font-medium"
      data-aos="fade-up"
      data-aos-delay={100}
    >
      <div className="relative flex w-full">
        <span
          aria-hidden="true"
          className={`bg-brand-carbon-black-950 absolute inset-y-0 left-0 w-1/2 rounded-lg shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${
            mode === "register" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        <button
          type="button"
          onClick={() => onChange("login")}
          aria-pressed={mode === "login"}
          className={`relative z-10 flex-1 cursor-pointer rounded-lg px-3 py-2 transition-colors duration-300 ease-out motion-reduce:transition-none ${
            mode === "login"
              ? "text-brand-alabaster-grey-100"
              : "text-brand-alabaster-grey-600 hover:text-brand-alabaster-grey-200"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => onChange("register")}
          aria-pressed={mode === "register"}
          className={`relative z-10 flex-1 cursor-pointer rounded-lg px-3 py-2 transition-colors duration-300 ease-out motion-reduce:transition-none ${
            mode === "register"
              ? "text-brand-alabaster-grey-100"
              : "text-brand-alabaster-grey-600 hover:text-brand-alabaster-grey-200"
          }`}
        >
          Register
        </button>
      </div>
    </div>
  );
}
