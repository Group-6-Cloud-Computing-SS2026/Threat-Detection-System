import CameraStream from "./CameraStream.tsx";
import { homePanelClass } from "../homeSurface.ts";

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

      <section className={`${homePanelClass} p-5`} data-aos="fade-up">
        <CameraStream />
      </section>
    </>
  );
}
