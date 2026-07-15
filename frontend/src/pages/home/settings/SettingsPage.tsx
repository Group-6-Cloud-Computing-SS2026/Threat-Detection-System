import Settings from "./Settings.tsx";
import { homePanelClass } from "../homeSurface.ts";

export default function SettingsPage() {
  return (
    <>
      <title>Settings | Threat Detection System</title>
      <meta property="og:title" content="Settings | Threat Detection System" />
      <meta
        name="description"
        content="Connection settings for the Threat Detection System dashboard."
      />

      <section className={`${homePanelClass} max-w-xl p-5`} data-aos="fade-up">
        <Settings />
      </section>
    </>
  );
}
