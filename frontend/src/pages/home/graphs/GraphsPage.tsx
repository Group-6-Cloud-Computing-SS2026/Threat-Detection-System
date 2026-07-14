import Graphs from "./Graphs.tsx";

export default function GraphsPage() {
  return (
    <>
      <title>Scaling Law Results | Threat Detection System</title>
      <meta
        property="og:title"
        content="Scaling Law Results | Threat Detection System"
      />
      <meta
        name="description"
        content="Amdahl's and Gustafson's law scaling benchmark results."
      />

        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 flex min-h-[calc(100vh-10rem)] flex-col rounded-2xl border p-5">
            <Graphs />
        </section>
    </>
  );
}
