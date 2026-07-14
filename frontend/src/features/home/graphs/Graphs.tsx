export default function Graphs() {
  return (
    <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 flex min-h-[calc(100vh-10rem)] flex-col rounded-2xl border p-5">
      <div className="mb-4">
        <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
          Amdahl&rsquo;s &amp; Gustafson&rsquo;s law results
        </h2>
        <p className="text-brand-alabaster-grey-600 text-sm">
          Scaling law benchmark charts served from
          /amdahl-gustafson-graphs.html.
        </p>
      </div>
      <iframe
        src="/amdahl-gustafson-graphs.html"
        title="Scaling law results"
        className="border-brand-carbon-black-800 bg-brand-pitch-black-500 flex-1 rounded-xl border"
      />
    </section>
  );
}
