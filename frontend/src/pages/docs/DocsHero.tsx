import Button from "../../shared/components/ui/Button.tsx";

const docsUrl: URL = new URL(
  "https://group-6-cloud-computing-ss2026.github.io/Threat-Detection-System/",
);

export default function DocsHero() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div data-aos="fade-up">
          <div className="mb-6 flex items-center gap-3">
            <img
              src="/images/wordmark-dark.svg"
              alt="ThreatOff"
              className="h-12 w-auto"
            />
            <span className="text-brand-alabaster-grey-600/70 text-sm font-medium tracking-[0.2em] uppercase">
              Docs
            </span>
          </div>
          <h1 className="gradient-text font-nacelle text-brand-alabaster-grey-100 mb-4 text-4xl leading-16 font-semibold md:text-5xl">
            Project documentation
          </h1>
          <p className="text-brand-alabaster-grey-600/80 mt-5 max-w-2xl text-lg">
            Start here for setup notes, architecture, workflows, and the full
            project documentation when you need more detail.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="github"
              href={docsUrl.href}
              target="_blank"
              rel="noreferrer"
            >
              Open docs
            </Button>
            <Button variant="secondary" className="bg-transparent" href="/">
              Back home
            </Button>
          </div>
        </div>

        <div
          className="overflow-hidden p-3 shadow-lg lg:max-w-md lg:justify-self-end"
          data-aos="fade-left"
        >
          <img
            src="/images/docs-picture.png"
            alt="ThreatOff docs"
            className="aspect-625/590 w-full rounded-xl object-cover"
          />
        </div>
      </div>
    </div>
  );
}
