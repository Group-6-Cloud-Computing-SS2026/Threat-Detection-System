import Graphs from "./Graphs.tsx";
import { homePanelClass } from "../homeSurface.ts";

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

      <section className={`${homePanelClass} flex min-h-[calc(100vh-10rem)] flex-col p-5`}>
        <Graphs />
      </section>
    </>
  );
}
