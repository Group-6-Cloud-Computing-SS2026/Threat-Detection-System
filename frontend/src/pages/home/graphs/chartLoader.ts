export type ChartScaleLike = {
  grid?: {
    color?: string;
    drawBorder?: boolean;
  };
  ticks?: {
    color?: string;
    callback?: (value: unknown) => string;
  };
};

export type ChartOptionsLike = {
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

export type ChartInstance = {
  destroy: () => void;
  update: () => void;
  options: ChartOptionsLike;
};

export type ChartCtor = {
  defaults: {
    font: { family: string; size: number };
    color: string;
  };
  new (
    canvas: HTMLCanvasElement,
    config: Record<string, unknown>,
  ): ChartInstance;
};

declare global {
  interface Window {
    Chart?: ChartCtor;
  }
}

const CHART_JS_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";

const chartJsLoader = {
  promise: null as Promise<ChartCtor> | null,
};

export function loadChartJs(): Promise<ChartCtor> {
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
