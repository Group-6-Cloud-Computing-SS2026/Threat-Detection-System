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
    <aside className="hidden min-h-full flex-col justify-between border-r border-brand-carbon-black-800 bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] p-10 lg:flex">
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
            className="group/card bg-brand-carbon-black-800 relative h-full overflow-hidden rounded-2xl p-px transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)] before:pointer-events-none before:absolute before:-top-10 before:-left-40 before:z-10 before:h-80 before:w-80 before:translate-x-(--mouse-x) before:translate-y-(--mouse-y) before:rounded-full before:bg-brand-alabaster-grey-100/15 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 group-hover:before:opacity-100 after:pointer-events-none after:absolute after:-top-48 after:-left-48 after:z-30 after:h-64 after:w-64 after:translate-x-(--mouse-x) after:translate-y-(--mouse-y) after:rounded-full after:bg-brand-alabaster-grey-100/25 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20"
          >
            <div className="bg-brand-pitch-black-500 after:from-brand-carbon-black-900/50 after:via-brand-carbon-black-800/25 after:to-brand-carbon-black-900/50 relative z-20 h-full overflow-hidden rounded-[inherit] after:absolute after:inset-0 after:bg-linear-to-br">
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
