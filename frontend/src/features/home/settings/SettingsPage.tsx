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

      <Settings />
    </>
  );
}
