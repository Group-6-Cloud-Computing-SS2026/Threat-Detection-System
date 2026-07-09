import { NavLink } from "react-router";
import Logo from "./Logo.tsx";
import Button from "./Button.tsx";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-brand-carbon-black-800 bg-brand-pitch-black-500/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-5">
          <NavLink
            to="/login"
            className="text-sm font-medium text-brand-alabaster-grey-600 transition hover:text-brand-alabaster-grey-100"
          >
            Login
          </NavLink>
          <Button href="/login?tab=register" size="sm">
            Register
          </Button>
        </nav>
      </div>
    </header>
  );
}
