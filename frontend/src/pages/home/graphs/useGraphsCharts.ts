import { useEffect, useRef, useState } from "react";
import { loadChartJs } from "./chartLoader.ts";
import type { ChartInstance } from "./chartLoader.ts";
import { BRANDS } from "./graphsData.ts";

export function useGraphsCharts() {
  const amdahlCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartsRef = useRef<ChartInstance[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let observer: MutationObserver | null = null;
    let mediaQuery: MediaQueryList | null = null;

    const syncTheme = () => {
      const chartApi = window.Chart;
      if (!chartApi) return;

      const styles = getComputedStyle(document.documentElement);
      const textColor =
        styles.getPropertyValue("--color-brand-alabaster-grey-600").trim() ||
        "#d3d3d3";
      const gridColor =
        styles.getPropertyValue("--color-brand-carbon-black-700").trim() ||
        "#232323";

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
          cause instanceof Error
            ? cause.message
            : "Unable to load chart assets.",
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

  return { amdahlCanvasRef, gustCanvasRef, isReady, error };
}
