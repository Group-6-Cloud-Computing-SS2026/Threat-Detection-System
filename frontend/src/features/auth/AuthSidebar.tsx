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
    <aside className="border-brand-carbon-black-800/80 hidden min-h-full flex-col justify-between border-r bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] p-10 lg:flex">
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
            <div className="text-brand-alabaster-grey-100 text-sm font-semibold tracking-[0.16em] uppercase">
              ThreatOff
            </div>
            <div className="text-brand-alabaster-grey-600 text-sm">
              Secure access portal
            </div>
          </div>
        </NavLink>

        <div className="mt-14 max-w-xl space-y-5">
          <p className="text-brand-light-green-300 text-sm font-medium tracking-wider uppercase">
            ThreatOff Platform
          </p>
          <h2 className="text-brand-alabaster-grey-50 motion-safe:animate-auth-fade text-4xl leading-tight font-semibold">
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
            className="group/card bg-brand-carbon-black-800 relative h-full overflow-hidden rounded-2xl p-px transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_28%,transparent_62%)] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
            <div className="bg-brand-pitch-black-500 relative z-10 h-full overflow-hidden rounded-[inherit]">
              <div className="p-6 text-center">
                <h3 className="text-brand-alabaster-grey-100 text-xl leading-tight font-semibold">
                  {card.label}
                </h3>
                <p className="text-brand-alabaster-grey-100/80 mx-auto mt-4 max-w-sm text-sm leading-6">
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
