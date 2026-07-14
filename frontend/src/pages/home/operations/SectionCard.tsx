import type { ReactNode } from "react";
import { homePanelClass } from "../homeSurface.ts";

export default function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`${homePanelClass} p-5 md:p-6`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-brand-alabaster-grey-100 text-lg font-semibold">
            {title}
          </h2>
          <p className="text-brand-alabaster-grey-600 text-sm">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

