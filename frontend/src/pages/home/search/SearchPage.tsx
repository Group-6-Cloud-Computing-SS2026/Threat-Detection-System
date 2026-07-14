import Search from "./Search.tsx";

export default function SearchPage() {
  return (
    <>
      <title>Search | Threat Detection System</title>
      <meta property="og:title" content="Search | Threat Detection System" />
      <meta
        name="description"
        content="Search and filter historical detection events."
      />

        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5">
            <Search />
        </section>
    </>
  );
}
