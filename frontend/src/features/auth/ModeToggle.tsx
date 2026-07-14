import type { AuthMode as Mode } from "../../shared/types";

type ModeToggleProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="bg-brand-carbon-black-800 mb-6 flex rounded-xl border border-brand-carbon-black-700 p-1 text-sm font-medium">
      <button
        type="button"
        onClick={() => onChange("login")}
        className={`flex-1 cursor-pointer rounded-lg px-3 py-2 transition ${
          mode === "login"
            ? "bg-brand-carbon-black-950 text-brand-alabaster-grey-100 shadow-sm"
            : "text-brand-alabaster-grey-600 hover:text-brand-alabaster-grey-200"
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onChange("register")}
        className={`flex-1 cursor-pointer rounded-lg px-3 py-2 transition ${
          mode === "register"
            ? "bg-brand-carbon-black-950 text-brand-alabaster-grey-100 shadow-sm"
            : "text-brand-alabaster-grey-600 hover:text-brand-alabaster-grey-200"
        }`}
      >
        Register
      </button>
    </div>
  );
}
