import Settings from "./Settings.tsx";

export default function SettingsPage() {
  return (
    <>
      <title>Settings | Threat Detection System</title>
      <meta property="og:title" content="Settings | Threat Detection System" />
      <meta
        name="description"
        content="Connection settings for the Threat Detection System dashboard."
      />

      <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 max-w-xl rounded-2xl border p-5">
        <Settings />
      </section>
    </>
  );
}
