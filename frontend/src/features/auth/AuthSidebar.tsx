import { NavLink } from "react-router";

const SIDEBAR_CARDS: Array<{
  label: string;
  description: string;
}> = [
  { label: "Real-time", description: "Detection and alerting flow" },
  { label: "Role-based", description: "Granular permissions for every user" },
  { label: "Local-first", description: "Fast access to your API" },
];

export default function AuthSidebar() {
  return (
    <aside className="hidden min-h-full flex-col justify-between border-r border-brand-carbon-black-800/80 bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] p-10 lg:flex">
      <div>
        <NavLink
          to="/landing"
          className="group inline-flex items-center gap-3 transition-transform duration-300 ease-out hover:translate-x-0.5"
        >
          <img
            src="/favicon.svg"
            alt="ThreatOff"
            className="h-12 w-12 transition-transform duration-300 ease-out group-hover:scale-105"
          />
          <div>
            <div className="text-brand-alabaster-grey-100 text-sm font-semibold uppercase tracking-[0.16em]">
              ThreatOff
            </div>
            <div className="text-brand-alabaster-grey-600 text-sm">
              Secure access portal
            </div>
          </div>
        </NavLink>

        <div className="mt-14 max-w-xl space-y-5">
          <p className="text-brand-light-green-300 text-sm font-medium uppercase tracking-wider">
            ThreatOff Platform
          </p>
          <h2 className="text-brand-alabaster-grey-50 text-4xl font-semibold leading-tight motion-safe:animate-auth-fade">
            Secure access to your monitoring platform.
          </h2>
          <p className="text-brand-alabaster-grey-600 mb-6 text-base leading-7">
            Authenticate to monitor cameras, review detected threats, manage
            operators, and receive real-time alerts from your edge
            infrastructure.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SIDEBAR_CARDS.map((card) => (
          <div
            key={card.label}
            className="group/card bg-brand-carbon-black-800 relative h-full overflow-hidden rounded-2xl p-px transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-brand-light-green-500/25 before:to-transparent after:pointer-events-none after:absolute after:inset-0 after:bg-linear-to-br after:from-brand-carbon-black-950/20 after:via-transparent after:to-brand-carbon-black-950/30"
          >
            <div className="bg-brand-pitch-black-500 relative z-20 h-full overflow-hidden rounded-[inherit]">
              <div className="p-6 text-center">
                <h3 className="text-brand-alabaster-grey-100 text-xl font-semibold leading-tight">
                  {card.label}
                </h3>
                <p className="mx-auto mt-4 max-w-sm text-brand-alabaster-grey-100/80 text-sm leading-6">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
