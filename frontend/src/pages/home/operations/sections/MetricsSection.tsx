import Button from "../../../../shared/components/ui/Button.tsx";
import { homeInnerFrameClass } from "../../homeSurface.ts";
import type { ConsoleData } from "../operationsTypes.ts";
import RawDetails from "../RawDetails.tsx";
import SectionCard from "../SectionCard.tsx";
import { operationsErrorClass } from "../operationsUtils.ts";

function buildMetricsPreview(raw: string) {
  return raw
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, 18)
    .join("\n");
}

export default function MetricsSection({
  data,
  apiBaseUrl,
  error,
}: {
  data: ConsoleData;
  apiBaseUrl: string;
  error?: string;
}) {
  const metricsPreview = data.metrics ? buildMetricsPreview(data.metrics) : "";

  return (
    <SectionCard
      title="Prometheus metrics"
      subtitle="Raw metric exposition from /metrics with a short preview of the live payload."
      action={
        <Button
          variant="secondary"
          href={`${apiBaseUrl.replace(/\/$/, "")}/metrics`}
          target="_blank"
          rel="noreferrer"
        >
          Open raw metrics
        </Button>
      }
    >
      {data.metrics ? (
        <>
          <div className="text-brand-alabaster-grey-600 mb-3 text-sm">
            Preview of the live metrics payload.
          </div>
          <pre
            className={`${homeInnerFrameClass} overflow-auto rounded-xl p-4 text-xs leading-6 whitespace-pre-wrap`}
          >
            {metricsPreview}
          </pre>
          <RawDetails label="Full payload" value={data.metrics} />
        </>
      ) : (
        <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
          Metrics endpoint not available or returned no payload.
        </div>
      )}
      {error ? (
        <div className={`${operationsErrorClass} mt-4`}>{error}</div>
      ) : null}
    </SectionCard>
  );
}
