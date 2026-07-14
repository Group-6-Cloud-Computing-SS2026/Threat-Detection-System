import Graphs from "./Graphs.tsx";

export default function GraphsPage() {
  return (
    <>
      <title>Scaling Results | Threat Detection System</title>
      <meta property="og:title" content="Scaling Results | Threat Detection System" />
      <meta
        name="description"
        content="Amdahl and Gustafson scaling benchmark results."
      />

      <section className="flex min-h-[calc(100vh-10rem)] flex-col" data-aos="fade-up">
        <Graphs />
      </section>
    </>
  );
}
