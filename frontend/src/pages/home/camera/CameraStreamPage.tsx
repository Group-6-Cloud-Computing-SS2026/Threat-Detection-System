import CameraStream from "./CameraStream.tsx";

export default function CameraStreamPage() {
  return (
    <>
      <title>Camera Stream | Threat Detection System</title>
      <meta
        property="og:title"
        content="Camera Stream | Threat Detection System"
      />
      <meta
        name="description"
        content="Direct MQTT preview of the live camera stream."
      />

        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5">
            <CameraStream />
        </section>
    </>
  );
}
