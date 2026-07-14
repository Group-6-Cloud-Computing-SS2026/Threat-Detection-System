import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext.tsx";
import {
  IconActivity,
  IconBarChart,
  IconCamera,
  IconFileCode,
  IconDocs,
  IconGrafana,
  IconLogout,
  IconLayoutDashboard,
  IconSearch,
  IconSettings,
} from "../../shared/components/ui/icons/NavIcons.tsx";
import { useApiSettings } from "./useApiSettings.ts";

const GRAFANA_URL = new URL(
  "http://192.168.1.50:3000/d/rpi-cluster-v4/raspberry-pi-cluster-e28094-monitoring?orgId=1&refresh=1m",
);

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-light-green-950 text-brand-light-green-400"
      : "text-brand-alabaster-grey-600 hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100"
  }`;

const externalLinkClass =
  "flex w-full shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-alabaster-grey-600 transition hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100";

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SidebarNavLink({
  to,
  end = false,
  children,
}: {
  to: string;
  end?: boolean;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive, isPending }) =>
        `flex w-full shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-brand-light-green-950 text-brand-light-green-400"
            : isPending
              ? "bg-brand-carbon-black-800 text-brand-alabaster-grey-300"
              : "text-brand-alabaster-grey-600 hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100"
        }`
      }
    >
      {({ isPending }) => (
        <>
          {children}
          {isPending ? (
            <span className="border-brand-light-green-500/40 border-t-brand-light-green-400 ml-auto h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export default function HomeSidebar() {
  const { auth, logout } = useAuth();
  const { apiBaseUrl } = useApiSettings();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const swaggerUrl = `${apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")}/docs`;

  return (
    <aside className="border-brand-carbon-black-800/80 flex shrink-0 flex-col border-b bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
      <div className="border-brand-carbon-black-800/80 flex shrink-0 items-center justify-between gap-3 border-b p-4 md:block md:border-b">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <NavLink to="/landing">
            <img
              src="/images/wordmark-dark.svg"
              alt="ThreatOff"
              className="h-14 w-auto"
            />
          </NavLink>
          <p className="text-brand-alabaster-grey-600 mt-0 text-xs tracking-wide uppercase md:mt-1.5">
            Surveillance dashboard
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileNavOpen((value) => !value)}
          aria-expanded={mobileNavOpen}
          aria-controls="home-sidebar-nav"
          className="text-brand-alabaster-grey-300 hover:bg-brand-carbon-black-800 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition md:hidden"
        >
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${
              mobileNavOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <nav
        id="home-sidebar-nav"
        className={`flex flex-1 flex-col overflow-y-auto p-3 md:flex md:min-h-0 md:gap-1 ${
          mobileNavOpen ? "flex" : "hidden"
        }`}
      >
        <div className="flex flex-col gap-0.5 md:gap-1">
          <p className="text-brand-alabaster-grey-600 hidden px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase md:block">
            Dashboard
          </p>
          <SidebarNavLink to="/" end>
            <IconLayoutDashboard className="h-4 w-4 shrink-0 opacity-70" />
            Overview
          </SidebarNavLink>
          <SidebarNavLink to="/camera">
            <IconCamera className="h-4 w-4 shrink-0 opacity-70" />
            Camera stream
          </SidebarNavLink>
          <SidebarNavLink to="/search">
            <IconSearch className="h-4 w-4 shrink-0 opacity-70" />
            Search events
          </SidebarNavLink>
        </div>

        <div className="flex flex-col gap-0.5 md:mt-4 md:gap-1">
          <p className="text-brand-alabaster-grey-600 hidden px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase md:block">
            System
          </p>
          <SidebarNavLink to="/settings">
            <IconSettings className="h-4 w-4 shrink-0 opacity-70" />
            Settings
          </SidebarNavLink>
          <SidebarNavLink to="/operations">
            <IconActivity className="h-4 w-4 shrink-0 opacity-70" />
            Operations
          </SidebarNavLink>
          <NavLink to="/docs" className={navLinkClass}>
            <IconDocs className="h-4 w-4 shrink-0 opacity-70" />
            Docs
          </NavLink>
          <SidebarNavLink to="/graphs">
            <IconBarChart className="h-4 w-4 shrink-0 opacity-70" />
            Scaling results
          </SidebarNavLink>
          <a
            href={GRAFANA_URL.href}
            target="_blank"
            className={externalLinkClass}
          >
            <IconGrafana className="h-4 w-4 shrink-0 opacity-70" />
            Grafana
          </a>
          <a href={swaggerUrl} target="_blank" className={externalLinkClass}>
            <IconFileCode className="h-4 w-4 shrink-0 opacity-70" />
            Swagger UI
          </a>
        </div>
      </nav>

      <div className="border-brand-carbon-black-800/80 shrink-0 border-t p-3">
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
          className="text-brand-brick-red-300 hover:bg-brand-brick-red-950 mt-2 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition"
        >
          <IconLogout className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
