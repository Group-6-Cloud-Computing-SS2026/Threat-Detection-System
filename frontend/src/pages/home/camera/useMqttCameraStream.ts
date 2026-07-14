import { useCallback, useEffect, useRef, useState } from "react";

const PAHO_SCRIPT_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js";
const STREAM_TOPIC = "cluster/camera/stream";

type PahoMessage = { destinationName: string; payloadString: string };
type PahoClient = {
  connect: (options: {
    timeout?: number;
    useSSL?: boolean;
    onSuccess: () => void;
    onFailure: (error: { errorMessage?: string }) => void;
  }) => void;
  disconnect: () => void;
  subscribe: (topic: string) => void;
  onConnectionLost: (response: {
    errorCode: number;
    errorMessage?: string;
  }) => void;
  onMessageArrived: (message: PahoMessage) => void;
};
type PahoNamespace = {
  MQTT: {
    Client: new (host: string, port: number, clientId: string) => PahoClient;
  };
};

declare global {
  interface Window {
    Paho?: PahoNamespace;
  }
}

let pahoLoadPromise: Promise<void> | null = null;

function loadPahoScript(): Promise<void> {
  if (window.Paho) return Promise.resolve();
  if (pahoLoadPromise) return pahoLoadPromise;

  pahoLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAHO_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load MQTT client library"));
    document.head.appendChild(script);
  });

  return pahoLoadPromise;
}

export type MqttStreamStatus = "disconnected" | "connecting" | "connected";

// Ports the direct-to-broker preview from public/camera_stream.html: same
// Paho MQTT client subscribing to cluster/camera/stream over WebSocket, no
// backend relay involved.
export function useMqttCameraStream() {
  const [brokerIp, setBrokerIp] = useState("192.168.1.50");
  const [brokerPort, setBrokerPort] = useState("9001");
  const [status, setStatus] = useState<MqttStreamStatus>("disconnected");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<PahoClient | null>(null);

  const disconnect = useCallback(() => {
    try {
      clientRef.current?.disconnect();
    } catch {
      // already disconnected
    }
    clientRef.current = null;
    setStatus("disconnected");
    setImageSrc(null);
  }, []);

  const connect = useCallback(async () => {
    const host = brokerIp.trim();
    const port = parseInt(brokerPort.trim(), 10);
    if (!host || Number.isNaN(port)) {
      setError("Enter a valid broker IP and WebSocket port.");
      return;
    }

    setError(null);
    setStatus("connecting");

    try {
      await loadPahoScript();
    } catch (err) {
      setStatus("disconnected");
      setError(
        err instanceof Error ? err.message : "Failed to load MQTT client library",
      );
      return;
    }

    const Paho = window.Paho;
    if (!Paho) {
      setStatus("disconnected");
      setError("MQTT client library unavailable.");
      return;
    }

    const client = new Paho.MQTT.Client(
      host,
      port,
      `tds_preview_${Math.random().toString(16).slice(2, 8)}`,
    );
    clientRef.current = client;

    client.onConnectionLost = (response) => {
      setStatus("disconnected");
      setImageSrc(null);
      setError(response.errorMessage || "Disconnected");
    };

    client.onMessageArrived = (message) => {
      if (message.destinationName !== STREAM_TOPIC) return;
      try {
        const payload = JSON.parse(message.payloadString);
        const image = payload.image || payload.image_base64;
        if (!image) return;
        setImageSrc(`data:image/jpeg;base64,${image}`);
      } catch {
        setError("Error reading stream frame.");
      }
    };

    client.connect({
      timeout: 5,
      useSSL: false,
      onSuccess: () => {
        setStatus("connected");
        client.subscribe(STREAM_TOPIC);
      },
      onFailure: (err) => {
        setStatus("disconnected");
        setError(err.errorMessage || "Failed to connect");
      },
    });
  }, [brokerIp, brokerPort]);

  useEffect(() => {
    return () => {
      try {
        clientRef.current?.disconnect();
      } catch {
        // unmounting
      }
    };
  }, []);

  return {
    brokerIp,
    setBrokerIp,
    brokerPort,
    setBrokerPort,
    status,
    imageSrc,
    error,
    connect,
    disconnect,
  };
}
