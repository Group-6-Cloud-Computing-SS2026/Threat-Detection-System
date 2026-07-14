import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext.tsx";
import {
  IconActivity,
  IconBarChart,
  IconCamera,
  IconDocs,
  IconGrafana,
  IconLogout,
  IconSearch,
  IconSettings,
} from "../../shared/components/ui/icons/NavIcons.tsx";

const GRAFANA_URL = new URL(
  "http://192.168.1.50:3000/d/rpi-cluster-v4/raspberry-pi-cluster-e28094-monitoring?orgId=1&refresh=1m",
);

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-light-green-950 text-brand-light-green-400"
      : "text-brand-alabaster-grey-600 hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100"
  }`;

const externalLinkClass =
  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-alabaster-grey-600 transition hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100";

export default function HomeSidebar() {
  const { auth, logout } = useAuth();

  return (
    <aside className="border-brand-carbon-black-800/80 bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] flex shrink-0 flex-col border-b md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
      <div className="border-brand-carbon-black-800/80 flex items-center justify-between gap-3 border-b p-4 md:block md:border-b md:p-5">
        <NavLink to="/landing">
          <img
            src="/images/wordmark-dark.svg"
            alt="ThreatOff"
            className="h-22 w-auto"
          />
        </NavLink>
        <p className="text-brand-alabaster-grey-600 mt-0 text-xs tracking-wide uppercase md:mt-3">
          Surveillance dashboard
        </p>
      </div>

      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible">
        <div className="flex flex-row gap-1 md:flex-col">
          <p className="text-brand-alabaster-grey-600 hidden px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase md:block">
            Dashboard
          </p>
          <NavLink to="/" end className={navLinkClass}>
            <IconActivity className="h-4 w-4 shrink-0 opacity-70" />
            Overview
          </NavLink>
          <NavLink to="/camera" className={navLinkClass}>
            <IconCamera className="h-4 w-4 shrink-0 opacity-70" />
            Camera stream
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            <IconSearch className="h-4 w-4 shrink-0 opacity-70" />
            Search events
          </NavLink>
        </div>

        <div className="flex flex-row gap-1 md:mt-6 md:flex-col">
          <p className="text-brand-alabaster-grey-600 hidden px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase md:block">
            System
          </p>
          <NavLink to="/settings" className={navLinkClass}>
            <IconSettings className="h-4 w-4 shrink-0 opacity-70" />
            Settings
          </NavLink>
          <NavLink to="/docs" target="_blank" className={navLinkClass}>
            <IconDocs className="h-4 w-4 shrink-0 opacity-70" />
            Docs
          </NavLink>
          <NavLink to="/graphs" className={navLinkClass}>
            <IconBarChart className="h-4 w-4 shrink-0 opacity-70" />
            Scaling law results
          </NavLink>
          <a
            href={GRAFANA_URL.href}
            target="_blank"
            className={externalLinkClass}
          >
            <IconGrafana className="h-4 w-4 shrink-0 opacity-70" />
            Grafana
          </a>
        </div>
      </nav>

      <div className="border-brand-carbon-black-800/80 border-t p-3">
        <div className="bg-brand-carbon-black-800/60 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="from-brand-light-green-500 to-brand-light-green-800 text-brand-pitch-black-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold">
            {auth?.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-brand-alabaster-grey-100 truncate text-xs font-semibold">
              {auth?.username}
            </p>
            <p className="text-brand-alabaster-grey-600 text-[11px]">
              Authenticated
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-brand-brick-red-300 hover:bg-brand-brick-red-950 mt-2 cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition"
        >
          <IconLogout className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
