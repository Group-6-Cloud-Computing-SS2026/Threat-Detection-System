import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  homeInnerFrameClass,
  homePanelClass,
} from "../homeSurface.ts";

type AmdahlRow = {
  wl: string;
  n: number;
  s1: number | null;
  p: number | null;
  s2: number | null;
  t: number;
  sd: number;
  sp: number | null;
  eff: number | null;
};

type GustRow = {
  set: string;
  sz: string;
  n: number;
  s1: number;
  p: number;
  s2: number;
  t: number;
  sd: number;
  sp: number;
  eff: number;
};

type ChartScaleLike = {
  grid?: {
    color?: string;
    drawBorder?: boolean;
  };
  ticks?: {
    color?: string;
    callback?: (value: unknown) => string;
  };
};

type ChartOptionsLike = {
  scales?: Record<string, ChartScaleLike>;
  plugins?: {
    legend?: {
      labels?: {
        color?: string;
      };
    };
    tooltip?: {
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
    };
  };
};

type ChartInstance = {
  destroy: () => void;
  update: () => void;
  options: ChartOptionsLike;
};

type ChartCtor = {
  defaults: {
    font: { family: string; size: number };
    color: string;
  };
  new (canvas: HTMLCanvasElement, config: Record<string, unknown>): ChartInstance;
};

declare global {
  interface Window {
    Chart?: ChartCtor;
  }
}

const CHART_JS_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";

const BRANDS = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  emerald: "#22c55e",
  red: "#bb0a21",
};

const amdahlRawData: AmdahlRow[] = [
  { wl: "200x150", n: 1, s1: 0.005, p: 3.015, s2: 0.007, t: 3.027, sd: 0.71, sp: 1.0, eff: 100 },
  { wl: "200x150", n: 2, s1: 0.003, p: 2.215, s2: 0.022, t: 2.24, sd: 0.45, sp: 1.35, eff: 68 },
  { wl: "200x150", n: 4, s1: 0.003, p: 2.028, s2: 0.026, t: 2.057, sd: 0.01, sp: 1.47, eff: 37 },
  { wl: "200x150", n: 8, s1: 0.003, p: 2.05, s2: 0.03, t: 2.083, sd: 0.01, sp: 1.45, eff: 18 },
  { wl: "400x300", n: 1, s1: 0.003, p: 2.209, s2: 0.004, t: 2.216, sd: 0.45, sp: 1.0, eff: 100 },
  { wl: "400x300", n: 2, s1: 0.003, p: 2.816, s2: 0.051, t: 2.87, sd: 0.45, sp: 0.77, eff: 39 },
  { wl: "400x300", n: 4, s1: 0.003, p: 2.228, s2: 0.053, t: 2.284, sd: 0.46, sp: 0.97, eff: 24 },
  { wl: "400x300", n: 8, s1: 0.003, p: 2.045, s2: 0.055, t: 2.103, sd: 0.01, sp: 1.05, eff: 13 },
  { wl: "800x600", n: 1, s1: 0.003, p: 4.014, s2: 0.005, t: 4.022, sd: 0.0, sp: 1.0, eff: 100 },
  { wl: "800x600", n: 2, s1: 0.003, p: 3.618, s2: 0.135, t: 3.756, sd: 0.54, sp: 1.07, eff: 54 },
  { wl: "800x600", n: 4, s1: 0.003, p: 3.028, s2: 0.137, t: 3.168, sd: 0.01, sp: 1.27, eff: 32 },
  { wl: "800x600", n: 8, s1: 0.003, p: 3.056, s2: 0.146, t: 3.205, sd: 0.02, sp: 1.26, eff: 16 },
  { wl: "1600x1200", n: 1, s1: 0.003, p: 10.03, s2: 0.005, t: 10.038, sd: 0.71, sp: 1.0, eff: 100 },
  { wl: "1600x1200", n: 2, s1: 0.003, p: 8.433, s2: 0.375, t: 8.811, sd: 0.91, sp: 1.14, eff: 57 },
  { wl: "1600x1200", n: 4, s1: 0.003, p: 6.036, s2: 0.465, t: 6.504, sd: 0.02, sp: 1.54, eff: 39 },
  { wl: "1600x1200", n: 8, s1: 0.003, p: 5.057, s2: 0.472, t: 5.532, sd: 0.02, sp: 1.81, eff: 23 },
  { wl: "2000x1504", n: 8, s1: null, p: null, s2: null, t: 8.366, sd: 0.54, sp: null, eff: null },
  { wl: "3200x2400", n: 1, s1: 0.003, p: 51.141, s2: 0.008, t: 51.152, sd: 3.55, sp: 1.0, eff: 100 },
  { wl: "3200x2400", n: 2, s1: 0.003, p: 28.483, s2: 1.224, t: 29.71, sd: 1.66, sp: 1.72, eff: 86 },
  { wl: "3200x2400", n: 4, s1: 0.003, p: 18.466, s2: 1.303, t: 19.772, sd: 0.89, sp: 2.59, eff: 65 },
  { wl: "3200x2400", n: 8, s1: 0.003, p: 13.478, s2: 1.654, t: 15.135, sd: 0.5, sp: 3.38, eff: 42 },
  { wl: "6400x4800", n: 1, s1: 0.0, p: 0.0, s2: 0.0, t: 0.0, sd: 0.0, sp: null, eff: null },
  { wl: "6400x4800", n: 4, s1: 0.003, p: 172.707, s2: 5.473, t: 178.183, sd: 37.45, sp: null, eff: null },
  { wl: "6400x4800", n: 8, s1: 0.004, p: 130.054, s2: 7.071, t: 137.129, sd: 42.19, sp: null, eff: null },
];

const gustRawData: GustRow[] = [
  { set: "Gustafson Set 1", sz: "1600x600", n: 1, s1: 0.004, p: 5.62, s2: 0.006, t: 5.63, sd: 0.9, sp: 1.0, eff: 100 },
  { set: "Gustafson Set 1", sz: "1600x1200", n: 2, s1: 0.003, p: 8.233, s2: 0.387, t: 8.623, sd: 1.11, sp: 1.95, eff: 98 },
  { set: "Gustafson Set 1", sz: "3200x1200", n: 4, s1: 0.003, p: 9.449, s2: 0.772, t: 10.224, sd: 0.87, sp: 3.77, eff: 94 },
  { set: "Gustafson Set 1", sz: "3200x2400", n: 8, s1: 0.004, p: 14.889, s2: 1.648, t: 16.541, sd: 1.31, sp: 7.3, eff: 91 },
  { set: "Gustafson Set 2", sz: "3200x1200", n: 1, s1: 0.004, p: 14.441, s2: 0.005, t: 14.45, sd: 0.55, sp: 1.0, eff: 100 },
  { set: "Gustafson Set 2", sz: "3200x2400", n: 2, s1: 0.003, p: 27.682, s2: 1.163, t: 28.848, sd: 1.33, sp: 1.96, eff: 98 },
  { set: "Gustafson Set 2", sz: "4800x2400", n: 4, s1: 0.002, p: 27.492, s2: 1.655, t: 29.149, sd: 0.89, sp: 3.83, eff: 96 },
  { set: "Gustafson Set 2", sz: "6400x4800", n: 8, s1: 0.004, p: 130.054, s2: 7.071, t: 137.129, sd: 42.19, sp: 7.64, eff: 95 },
];

const chartJsLoader = {
  promise: null as Promise<ChartCtor> | null,
};

function loadChartJs(): Promise<ChartCtor> {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (chartJsLoader.promise) return chartJsLoader.promise;

  chartJsLoader.promise = new Promise<ChartCtor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHART_JS_SRC}"]`,
    );

    const handleReady = () => {
      if (window.Chart) {
        resolve(window.Chart);
      } else {
        reject(new Error("Chart.js did not initialize."));
      }
    };

    if (existing) {
      if (window.Chart) {
        resolve(window.Chart);
        return;
      }

      existing.addEventListener("load", handleReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load Chart.js.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CHART_JS_SRC;
    script.async = true;
    script.onload = handleReady;
    script.onerror = () => reject(new Error("Unable to load Chart.js."));
    document.head.appendChild(script);
  });

  return chartJsLoader.promise;
}

function formatSeconds(value: number | null) {
  return value === null ? "N/A" : `${value.toFixed(3)}s`;
}

function formatOptionalNumber(value: number | null, digits = 2, suffix = "x") {
  return value === null ? "N/A" : `${value.toFixed(digits)}${suffix}`;
}

function useHorizontalDragScroll() {
  const draggingRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScrollLeft: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.currentTarget;
    if (target.scrollWidth <= target.clientWidth) return;

    event.preventDefault();

    draggingRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: target.scrollLeft,
    };

    target.setPointerCapture(event.pointerId);
    target.classList.add("select-none");
    target.style.cursor = "grabbing";
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = draggingRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;

    const target = event.currentTarget;
    const deltaX = event.clientX - state.startX;
    target.scrollLeft = state.startScrollLeft - deltaX;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = draggingRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;

    const target = event.currentTarget;
    state.active = false;
    state.pointerId = null;
    target.classList.remove("select-none");
    target.style.cursor = "";

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

const amdahlMaxSpeedup = Math.max(
  ...amdahlRawData.map((row) => row.sp ?? 0),
).toFixed(2);
const gustMaxSpeedup = Math.max(
  ...gustRawData.map((row) => row.sp),
).toFixed(2);
const amdahlLowSignalRows = amdahlRawData.filter((row) => row.sp === null).length;

export default function Graphs() {
  const amdahlCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartsRef = useRef<ChartInstance[]>([]);
  const amdahlTableDrag = useHorizontalDragScroll();
  const gustTableDrag = useHorizontalDragScroll();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summaries = useMemo(
    () => [
      { label: "Amdahl rows", value: String(amdahlRawData.length) },
      { label: "Gustafson rows", value: String(gustRawData.length) },
      { label: "Top speedup", value: `${gustMaxSpeedup}x` },
    ],
    [],
  );

  useEffect(() => {
    let active = true;
    let observer: MutationObserver | null = null;
    let mediaQuery: MediaQueryList | null = null;

    const syncTheme = () => {
      const chartApi = window.Chart;
      if (!chartApi) return;

      const styles = getComputedStyle(document.documentElement);
      const textColor = styles.getPropertyValue("--text-secondary").trim();
      const gridColor = styles.getPropertyValue("--border-default").trim();

      chartApi.defaults.font.family = "Nacelle, sans-serif";
      chartApi.defaults.font.size = 14;
      chartApi.defaults.color = textColor;

      chartsRef.current.forEach((chart) => {
        if (chart.options.scales) {
          Object.values(chart.options.scales).forEach((scale) => {
            scale.grid = { color: gridColor, drawBorder: false };
            scale.ticks = { color: textColor };
          });
        }

        if (chart.options.plugins?.legend?.labels) {
          chart.options.plugins.legend.labels.color = "#eaeaea";
        }

        if (chart.options.plugins?.tooltip) {
          chart.options.plugins.tooltip.titleColor = "#b4b4b4";
          chart.options.plugins.tooltip.bodyColor = textColor;
          chart.options.plugins.tooltip.borderColor = gridColor;
        }

        chart.update();
      });
    };

    const destroyCharts = () => {
      chartsRef.current.forEach((chart) => chart.destroy());
      chartsRef.current = [];
    };

    const bootstrap = async () => {
      try {
        const Chart = await loadChartJs();
        if (!active) return;

        Chart.defaults.font.family = "Nacelle, sans-serif";
        Chart.defaults.font.size = 14;

        if (!amdahlCanvasRef.current || !gustCanvasRef.current) return;

        const baseOptions = {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              position: "top",
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
              },
            },
            tooltip: {
              backgroundColor: "#0d0d0d",
              borderColor: "#bfbfbf",
              borderWidth: 1,
              cornerRadius: 12,
              padding: 14,
              displayColors: true,
              boxPadding: 6,
              titleColor: "#eaeaea",
              bodyColor: "#eaeaea",
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { drawBorder: false },
              ticks: { callback: (value: unknown) => `${value}` },
            },
          },
        };

        const amdahlChart = new Chart(amdahlCanvasRef.current, {
          type: "bar",
          data: {
            labels: ["1N", "2N", "4N", "8N"],
            datasets: [
              {
                label: "1600x1200",
                data: [10.038, 8.811, 6.504, 5.532],
                backgroundColor: `${BRANDS.blue}88`,
                borderColor: BRANDS.blue,
                borderWidth: 1,
                borderRadius: 2,
              },
              {
                label: "3200x2400",
                data: [51.152, 29.71, 19.772, 15.135],
                backgroundColor: `${BRANDS.emerald}88`,
                borderColor: BRANDS.emerald,
                borderWidth: 1,
                borderRadius: 2,
              },
            ],
          },
          options: baseOptions,
        });

        const gustChart = new Chart(gustCanvasRef.current, {
          type: "bar",
          data: {
            labels: ["1N", "2N", "4N", "8N"],
            datasets: [
              {
                label: "Set 1 (1600x600 for 1st node)",
                data: [5.63, 8.623, 10.224, 16.541],
                backgroundColor: `${BRANDS.violet}88`,
                borderColor: BRANDS.violet,
                borderWidth: 1,
                borderRadius: 2,
              },
              {
                label: "Set 2 (3200x1200 for node)",
                data: [14.45, 28.848, 29.149, 137.129],
                backgroundColor: `${BRANDS.red}88`,
                borderColor: BRANDS.red,
                borderWidth: 1,
                borderRadius: 2,
              },
            ],
          },
          options: baseOptions,
        });

        chartsRef.current = [amdahlChart, gustChart];
        syncTheme();

        observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });

        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", syncTheme);

        setIsReady(true);
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to load chart assets.",
        );
      }
    };

    void bootstrap();

    return () => {
      active = false;
      observer?.disconnect();
      if (mediaQuery) {
        mediaQuery.removeEventListener("change", syncTheme);
      }
      destroyCharts();
    };
  }, []);

  const chartCardClass = `${homePanelClass} p-4 md:p-5`;
  const tableCardClass = `${homePanelClass} p-0 overflow-hidden`;

  let lastAmdahlWl = "";
  let lastGustSet = "";

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
              Amdahl and Gustafson results, shown in a React page with the
              same surface and chart styling as the rest of the app.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {summaries.map((item) => (
              <div
                key={item.label}
                className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-3 py-2"
              >
                <div className="text-brand-alabaster-grey-600 text-[11px] uppercase tracking-[0.2em]">
                  {item.label}
                </div>
                <div className="text-brand-alabaster-grey-100 mt-1 text-lg font-semibold tabular-nums">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-linear-to-r from-transparent via-brand-light-green-500/40 to-transparent h-px" />
      </header>

      <section className="grid gap-4 lg:grid-cols-2" data-aos="fade-up" data-aos-delay={80}>
        <article className={chartCardClass}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-brand-alabaster-grey-100 text-lg font-semibold">
                Amdahl&apos;s law
              </h2>
              <p className="text-brand-alabaster-grey-600 text-sm">
                Avg total time by node count.
              </p>
            </div>
            <span className="text-brand-light-green-300 bg-brand-light-green-950/70 border-brand-light-green-500/20 rounded-full border px-2.5 py-1 text-[11px] font-medium self-start">
              max speedup {amdahlMaxSpeedup}x
            </span>
          </div>

          <div className="relative h-80">
            {!isReady ? (
              <div className="bg-brand-pitch-black-500/95 absolute inset-0 grid place-items-center rounded-xl">
                <div className="text-brand-alabaster-grey-600 text-sm">
                  Loading Chart.js...
                </div>
              </div>
            ) : null}
            {error ? (
              <div className="bg-brand-brick-red-950 text-brand-brick-red-300 absolute inset-x-0 top-0 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            ) : null}
            <canvas ref={amdahlCanvasRef} />
          </div>
        </article>

        <article className={chartCardClass}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-brand-alabaster-grey-100 text-lg font-semibold">
                Gustafson&apos;s law
              </h2>
              <p className="text-brand-alabaster-grey-600 text-sm">
                Avg total time by scaled workload.
              </p>
            </div>
            <span className="text-brand-brick-red-300 bg-brand-brick-red-950/70 border-brand-brick-red-500/20 rounded-full border px-2.5 py-1 text-[11px] font-medium self-start">
              max speedup {gustMaxSpeedup}x
            </span>
          </div>

          <div className="relative h-80">
            {!isReady ? (
              <div className="bg-brand-pitch-black-500/95 absolute inset-0 grid place-items-center rounded-xl">
                <div className="text-brand-alabaster-grey-600 text-sm">
                  Loading Chart.js...
                </div>
              </div>
            ) : null}
            {error ? (
              <div className="bg-brand-brick-red-950 text-brand-brick-red-300 absolute inset-x-0 top-0 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            ) : null}
            <canvas ref={gustCanvasRef} />
          </div>
        </article>
      </section>

      <section className="space-y-4" data-aos="fade-up" data-aos-delay={140}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-brand-alabaster-grey-100 text-lg font-semibold">
              Results tables
            </h2>
            <p className="text-brand-alabaster-grey-600 text-sm">
              {amdahlLowSignalRows} Amdahl rows are missing speedup values and are
              marked accordingly.
            </p>
          </div>
        </div>

        <article className={tableCardClass}>
          <div
            className={`${homeInnerFrameClass} cursor-grab active:cursor-grabbing overflow-x-auto`}
            {...amdahlTableDrag}
          >
            <table className="min-w-[920px] border-collapse text-sm">
              <colgroup>
                <col className="lg:w-[16%]" />
                <col className="lg:w-[8%]" />
                <col className="lg:w-[11%]" />
                <col className="lg:w-[11%]" />
                <col className="lg:w-[11%]" />
                <col className="lg:w-[13%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[10%]" />
              </colgroup>
              <thead>
                <tr className="bg-brand-carbon-black-800">
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-left uppercase tracking-[0.16em]">
                    Workload
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-left uppercase tracking-[0.16em]">
                    Nodes
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Avg Seq 1
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Avg Parallel
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Avg Seq 2
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Avg Total Time
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Std Dev
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Speedup
                  </th>
                  <th className="text-brand-alabaster-grey-100 whitespace-nowrap px-4 py-3 text-right uppercase tracking-[0.16em]">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody>
                {amdahlRawData.map((row) => {
                  const displayWl = row.wl !== lastAmdahlWl ? row.wl : "";
                  lastAmdahlWl = row.wl;
                  const stateClass =
                    row.sp === null
                      ? "text-brand-brick-red-300"
                      : row.sp >= 3
                        ? "text-brand-light-green-300"
                        : row.sp >= 1.2
                          ? "text-brand-brick-red-200"
                          : "text-brand-brick-red-300";

                  return (
                    <tr
                      key={`${row.wl}-${row.n}`}
                      className="border-brand-carbon-black-700/70 hover:bg-brand-carbon-black-800/55 border-t transition"
                    >
                      <td className="text-brand-alabaster-grey-100 px-4 py-3 font-semibold">
                        {displayWl}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3">
                        {row.n}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {formatSeconds(row.s1)}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {formatSeconds(row.p)}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {formatSeconds(row.s2)}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.t.toFixed(3)}s
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        &plusmn;{row.sd.toFixed(2)}s
                      </td>
                      <td
                        className={`${stateClass} px-4 py-3 text-right font-semibold tabular-nums`}
                      >
                        {formatOptionalNumber(row.sp)}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.eff === null ? "N/A" : `${row.eff}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className={tableCardClass}>
          <div
            className={`${homeInnerFrameClass} cursor-grab active:cursor-grabbing overflow-x-auto`}
            {...gustTableDrag}
          >
            <table className="min-w-[1040px] border-collapse text-sm">
              <colgroup>
                <col className="lg:w-[14%]" />
                <col className="lg:w-[11%]" />
                <col className="lg:w-[8%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[13%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[10%]" />
                <col className="lg:w-[10%]" />
              </colgroup>
              <thead>
                <tr className="bg-brand-carbon-black-800">
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    <span className="block">Set</span>
                    <span className="block">Description</span>
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    Size
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    Nodes
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    <span className="block">Avg Seq</span>
                    <span className="block">1</span>
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    <span className="block">Avg</span>
                    <span className="block">Parallel</span>
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    <span className="block">Avg Seq</span>
                    <span className="block">2</span>
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    <span className="block">Avg Total</span>
                    <span className="block">Time</span>
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    Std Dev
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    <span className="block">Scaled</span>
                    <span className="block">Speedup</span>
                  </th>
                  <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom uppercase leading-tight tracking-[0.16em] whitespace-nowrap">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody>
                {gustRawData.map((row) => {
                  const displaySet = row.set !== lastGustSet ? row.set : "";
                  lastGustSet = row.set;
                  const stateClass =
                    row.sp >= 7
                      ? "text-brand-light-green-300"
                      : row.sp >= 3.5
                        ? "text-brand-brick-red-200"
                        : "text-brand-brick-red-300";

                  return (
                    <tr
                      key={`${row.set}-${row.sz}-${row.n}`}
                      className="border-brand-carbon-black-700/70 hover:bg-brand-carbon-black-800/55 border-t transition"
                    >
                      <td className="text-brand-alabaster-grey-100 px-4 py-3 font-semibold">
                        {displaySet}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3">
                        {row.sz}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3">
                        {row.n}
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.s1.toFixed(3)}s
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.p.toFixed(3)}s
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.s2.toFixed(3)}s
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.t.toFixed(3)}s
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        &plusmn;{row.sd.toFixed(2)}s
                      </td>
                      <td
                        className={`${stateClass} px-4 py-3 text-right font-semibold tabular-nums`}
                      >
                        {row.sp.toFixed(2)}x
                      </td>
                      <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                        {row.eff}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
