import DocsHero from "./DocsHero.tsx";
import DocsOverview from "./DocsOverview.tsx";

export default function DocsPage() {
  return (
    <>
      <title>Docs | Threat Detection System</title>
      <meta property="og:title" content="Docs | Threat Detection System" />
      <meta
        name="description"
        content="Documentation for the Threat Detection System project, with setup notes, workflow snapshots, and links to the full docs."
      />

      <section className="bg-brand-pitch-black-500">
        <DocsHero />
        <DocsOverview />
      </section>
    </>
  );
}
