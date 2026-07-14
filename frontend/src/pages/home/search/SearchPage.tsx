import Search from "./Search.tsx";
import { homePanelClass } from "../homeSurface.ts";

export default function SearchPage() {
  return (
    <>
      <title>Search | Threat Detection System</title>
      <meta property="og:title" content="Search | Threat Detection System" />
      <meta
        name="description"
        content="Search and filter historical detection events."
      />

      <section className={`${homePanelClass} p-5`} data-aos="fade-up">
        <Search />
      </section>
    </>
  );
}
