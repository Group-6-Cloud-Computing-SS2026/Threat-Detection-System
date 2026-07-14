import { IconCamera } from "../../../shared/components/ui/icons/NavIcons.tsx";
import Button from "../../../shared/components/ui/Button.tsx";
import { useMqttCameraStream } from "./useMqttCameraStream.ts";
import { homeInnerFrameClass } from "../homeSurface.ts";

export default function CameraStream() {
  const {
    brokerIp,
    setBrokerIp,
    brokerPort,
    setBrokerPort,
    status,
    imageSrc,
    error,
    connect,
    disconnect,
  } = useMqttCameraStream();

  const connected = status === "connected";
  const connecting = status === "connecting";

  return (
    <>
      <div className="mb-4" data-aos="fade-up">
        <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
          Camera stream
        </h2>
        <p className="text-brand-alabaster-grey-600 text-sm">
          Direct MQTT preview of cluster/camera/stream over WebSocket.
        </p>
      </div>

      <div
        className="mb-4 grid gap-3 sm:grid-cols-[1.6fr_1fr_auto] sm:items-end"
        data-aos="fade-up"
        data-aos-delay={120}
      >
        <label className="space-y-1.5 text-sm">
          <span className="text-brand-alabaster-grey-500">Broker IP</span>
          <input
            className="border-brand-carbon-black-700 bg-brand-carbon-black-800 text-brand-alabaster-grey-100 focus:border-brand-light-green-500 w-full rounded-lg border px-3 py-2 text-sm transition outline-none disabled:opacity-60"
            value={brokerIp}
            onChange={(event) => setBrokerIp(event.target.value)}
            disabled={connected || connecting}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-brand-alabaster-grey-500">WebSocket port</span>
          <input
            className="border-brand-carbon-black-700 bg-brand-carbon-black-800 text-brand-alabaster-grey-100 focus:border-brand-light-green-500 w-full rounded-lg border px-3 py-2 text-sm transition outline-none disabled:opacity-60"
            value={brokerPort}
            onChange={(event) => setBrokerPort(event.target.value)}
            disabled={connected || connecting}
          />
        </label>
        <Button
          size="sm"
          type="button"
          onClick={() => (connected ? disconnect() : void connect())}
          disabled={connecting}
        >
          {connecting ? "Connecting..." : connected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      <div
        className={`${homeInnerFrameClass} flex aspect-video items-center justify-center overflow-hidden rounded-xl`}
        data-aos="zoom-in"
        data-aos-delay={220}
      >
        {imageSrc ? (
          <img
            className="h-full w-full object-contain"
            src={imageSrc}
            alt="Live camera stream"
          />
        ) : (
          <div className="text-brand-alabaster-grey-600 flex flex-col items-center gap-3 px-6 py-12 text-center">
            <IconCamera className="h-10 w-10 opacity-40" />
            <p className="max-w-64 text-sm">
              {error ||
                (connecting
                  ? "Connecting to broker…"
                  : "Connect to cluster/camera/stream to preview the live feed.")}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
