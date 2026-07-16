import { useMemo } from "react";
import AmdahlTable from "./AmdahlTable.tsx";
import ChartCard from "./ChartCard.tsx";
import GustTable from "./GustTable.tsx";
import {
  amdahlLowSignalRows,
  amdahlMaxSpeedup,
  amdahlRawData,
  gustMaxSpeedup,
  gustRawData,
} from "./graphsData.ts";
import { useGraphsCharts } from "./useGraphsCharts.ts";

export default function Graphs() {
  const { amdahlCanvasRef, gustCanvasRef, isReady, error } = useGraphsCharts();

  const summaries = useMemo(
    () => [
      { label: "Amdahl rows", value: String(amdahlRawData.length) },
      { label: "Gustafson rows", value: String(gustRawData.length) },
      { label: "Top speedup", value: `${gustMaxSpeedup}x` },
    ],
    [],
  );

  return (
    <div className="font-nacelle space-y-6">
      <header className="space-y-4" data-aos="fade-up">
        <div className="flex items-center gap-3">
          <span className="text-brand-light-green-300 text-xs font-semibold tracking-[0.22em] uppercase">
            Benchmark report
          </span>
          <span className="bg-brand-carbon-black-800 text-brand-alabaster-grey-300 rounded-full px-2.5 py-1 text-[11px] font-medium">
            Data
          </span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-brand-alabaster-grey-100 text-3xl font-semibold md:text-4xl">
              Scaling results
            </h1>
            <p className="text-brand-alabaster-grey-600 mt-3 text-sm md:text-base">
              Amdahl and Gustafson results, shown in a React page with the same
              surface and chart styling as the rest of the app.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {summaries.map((item) => (
              <div
                key={item.label}
                className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-3 py-2"
              >
                <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.2em] uppercase">
                  {item.label}
                </div>
                <div className="text-brand-alabaster-grey-100 mt-1 text-lg font-semibold tabular-nums">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="via-brand-light-green-500/40 h-px bg-linear-to-r from-transparent to-transparent" />
      </header>

      <section
        className="grid gap-4 lg:grid-cols-2"
        data-aos="fade-up"
        data-aos-delay={80}
      >
        <ChartCard
          title="Amdahl's law"
          subtitle="Avg total time by node count."
          badgeText={`max speedup ${amdahlMaxSpeedup}x`}
          badgeClassName="text-brand-light-green-300 bg-brand-light-green-950/70 border-brand-light-green-500/20"
          canvasRef={amdahlCanvasRef}
          isReady={isReady}
          error={error}
        />

        <ChartCard
          title="Gustafson's law"
          subtitle="Avg total time by scaled workload."
          badgeText={`max speedup ${gustMaxSpeedup}x`}
          badgeClassName="text-brand-brick-red-300 bg-brand-brick-red-950/70 border-brand-brick-red-500/20"
          canvasRef={gustCanvasRef}
          isReady={isReady}
          error={error}
        />
      </section>

      <section className="space-y-4" data-aos="fade-up" data-aos-delay={140}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-brand-alabaster-grey-100 text-lg font-semibold">
              Results tables
            </h2>
            <p className="text-brand-alabaster-grey-600 text-sm">
              {amdahlLowSignalRows} Amdahl rows are missing speedup values and
              are marked accordingly.
            </p>
          </div>
        </div>

        <AmdahlTable />
        <GustTable />
      </section>
    </div>
  );
}
