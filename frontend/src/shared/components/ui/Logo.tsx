import { NavLink } from "react-router";

export default function Logo() {
  return (
    <NavLink
      to="/"
      className="inline-flex shrink-0 items-center"
      aria-label="ThreatOff"
      end
    >
      <img
        src="/favicon.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8"
      />
    </NavLink>
  );
}
