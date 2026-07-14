import { useEffect, useState } from "react";

export type StreamStatus = "connected" | "connecting" | "disconnected";

const RECONNECT_DELAY_MS = 5000;
const FPS_SAMPLE_WINDOW = 10;

function buildWsUrl(apiBaseUrl: string, token: string) {
  const origin = apiBaseUrl.replace(/\/$/, "");
  const base =
    origin.startsWith("http://") || origin.startsWith("https://")
      ? origin.replace(/^http/, "ws")
      : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${origin}`;
  return `${base}/stream/ws?token=${encodeURIComponent(token)}`;
}

export function useCameraStream(apiBaseUrl: string, token: string | undefined) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<StreamStatus>("disconnected");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus("disconnected");
      return;
    }

    let socket: WebSocket | null = null;
    let isMounted = true;
    let reconnectTimer: number | undefined;
    let lastFrameTime = performance.now();
    const fpsSamples: number[] = [];

    function connect() {
      setStatus("connecting");
      socket = new WebSocket(buildWsUrl(apiBaseUrl, token!));

      socket.onopen = () => {
        if (isMounted) setStatus("connected");
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          const base64Data = payload.image || payload.image_base64;
          if (!base64Data) return;

          setImageSrc(`data:image/jpeg;base64,${base64Data}`);
          if (payload.timestamp) {
            setLatencyMs(Date.now() - new Date(payload.timestamp).getTime());
          }

          const now = performance.now();
          fpsSamples.push(Math.round(1000 / (now - lastFrameTime)));
          lastFrameTime = now;
          if (fpsSamples.length > FPS_SAMPLE_WINDOW) fpsSamples.shift();
          setFps(
            Math.round(
              fpsSamples.reduce((sum, value) => sum + value, 0) /
                fpsSamples.length,
            ),
          );
          setFrameCount((count) => count + 1);
        } catch {
          // malformed frame
        }
      };

      socket.onerror = () => {
        if (isMounted) setStatus("disconnected");
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setStatus("disconnected");
        setImageSrc(null);
        reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      isMounted = false;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [apiBaseUrl, token]);

  return { imageSrc, status, latencyMs, fps, frameCount };
}
