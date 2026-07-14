import Button from "../../shared/components/ui/Button.tsx";

const docsUrl: URL = new URL(
  "https://group-6-cloud-computing-ss2026.github.io/Threat-Detection-System/",
);

export default function DocsHero() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <img
              src="/images/wordmark-dark.svg"
              alt="ThreatOff"
              className="h-12 w-auto"
            />
            <span className="text-brand-alabaster-grey-600/70 text-sm font-medium uppercase tracking-[0.2em]">
              Docs
            </span>
          </div>
          <h1 className="gradient-text font-nacelle text-brand-alabaster-grey-100 text-4xl font-semibold md:text-5xl">
            Documentation built for the edge pipeline
          </h1>
          <p className="text-brand-alabaster-grey-600/80 mt-5 max-w-2xl text-lg">
            This page is the entry point for the project documentation. It
            summarizes the moving parts, shows the core workflow, and sends you
            to the full project docs when you need the complete setup and
            deployment notes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="github"
              href={docsUrl.href}
              target="_blank"
              rel="noreferrer"
            >
              Open Full Docs
            </Button>
            <Button variant="secondary" className="bg-transparent" href="/">
              Back to Home
            </Button>
          </div>
        </div>

        <div className="overflow-hidden p-3 shadow-lg">
          <img
            src="/images/docs-picture.png"
            alt="ThreatOff docs"
            className="aspect-1229/819 w-full rounded-xl object-cover"
          />
        </div>
      </div>
    </div>
  );
}
