import DocsHero from "./DocsHero.tsx";

export default function DocsPage() {
  return (
    <>
      <title>Docs | Threat Detection System</title>
      <meta property="og:title" content="Docs | Threat Detection System" />
      <meta
        name="description"
        content="Documentation for the Threat Detection System project, with setup notes, workflow snapshots, and links to the full docs."
      />

      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.05)_0%,transparent_30%),linear-gradient(180deg,rgba(6,6,6,0.99)_0%,rgba(10,10,10,0.985)_52%,rgba(8,8,8,1)_100%)]">
        <DocsHero />
      </section>
    </>
  );
}
