import Logo from "./Logo.tsx";
import Button from "./Button.tsx";

export default function Header() {
  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-brand-carbon-black-900/90 px-3 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-brand-carbon-black-800),var(--color-brand-carbon-black-700),var(--color-brand-carbon-black-800))_border-box] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:[-webkit-mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] after:absolute after:inset-0 after:-z-10 after:backdrop-blur-xs">
          <Logo />
          <Button href="/login" size="sm">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
}
