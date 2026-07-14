import { IconCamera } from "../../shared/components/ui/icons/NavIcons.tsx";
import { useCameraStream } from "./useCameraStream.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { homeInnerFrameClass, homePanelClass } from "./homeSurface.ts";

const STATUS_STYLES: Record<string, string> = {
  connected: "bg-brand-light-green-950 text-brand-light-green-400",
  connecting: "bg-brand-carbon-black-700 text-brand-alabaster-grey-400",
  disconnected: "bg-brand-brick-red-950 text-brand-brick-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  connected: "Live",
  connecting: "Connecting",
  disconnected: "Offline",
};

export default function CameraFeed({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { auth } = useAuth();
  const { imageSrc, status, latencyMs, fps, frameCount } = useCameraStream(
    apiBaseUrl,
    auth?.token,
  );

  return (
    <section className={`${homePanelClass} p-5`} data-aos="fade-right">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3" data-aos="fade-up">
        <div>
          <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
            Camera feed
          </h2>
          <p className="text-brand-alabaster-grey-600 text-sm">
            Live edge telemetry via WebSocket.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className={`${homeInnerFrameClass} flex aspect-video items-center justify-center overflow-hidden rounded-xl`} data-aos="zoom-in" data-aos-delay={100}>
        {imageSrc ? (
          <img
            className="h-full w-full object-cover"
            src={imageSrc}
            alt="Live camera preview"
          />
        ) : (
          <div className="text-brand-alabaster-grey-600 flex flex-col items-center gap-3 px-6 py-12 text-center">
            <IconCamera className="h-10 w-10 opacity-40" />
            <p className="max-w-56 text-sm">
              {status === "connecting"
                ? "Connecting to edge node…"
                : "Awaiting stream from edge node"}
            </p>
          </div>
        )}
      </div>

      <div className="text-brand-alabaster-grey-600 mt-3 flex flex-wrap gap-5 text-xs" data-aos="fade-up" data-aos-delay={160}>
        <span>
          Latency:{" "}
          <strong className="text-brand-alabaster-grey-300 font-mono font-medium">
            {latencyMs !== null ? `${latencyMs}ms` : "—"}
          </strong>
        </span>
        <span>
          FPS:{" "}
          <strong className="text-brand-alabaster-grey-300 font-mono font-medium">
            {fps !== null ? `${fps}fps` : "—"}
          </strong>
        </span>
        <span>
          Frames:{" "}
          <strong className="text-brand-alabaster-grey-300 font-mono font-medium">
            {frameCount}
          </strong>
        </span>
      </div>
    </section>
  );
}
