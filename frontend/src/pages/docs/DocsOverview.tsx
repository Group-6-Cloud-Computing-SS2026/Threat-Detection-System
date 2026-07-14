export default function DocsOverview() {
  return (
    <div className="[border-image:linear-gradient(to_right,transparent,--theme(--color-brand-carbon-black-700/.5),transparent)1] border-t">
      <div className="relative isolate overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 left-1/2 -z-10 -mt-24 -translate-x-1/2 opacity-70"
          aria-hidden="true"
        >
          <img
            className="max-w-none rotate-180"
            src="/images/blurred-shape-gray.svg"
            width={760}
            height={668}
            alt=""
          />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -mb-72 translate-x-[-120%] opacity-55"
          aria-hidden="true"
        >
          <img
            className="max-w-none rotate-180"
            src="/images/blurred-shape-gray.svg"
            width={760}
            height={668}
            alt=""
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center" data-aos="fade-up">
            <div className="before:to-brand-light-green-200/50 after:to-brand-light-green-200/50 inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent after:h-px after:w-8 after:bg-linear-to-l after:from-transparent">
              <span className="text-brand-light-green-300 inline-flex font-medium tracking-wide">
                What the docs cover
              </span>
            </div>
            <h2 className="gradient-text font-nacelle text-brand-alabaster-grey-100 pb-4 text-3xl font-semibold md:text-4xl">
              The sections you actually need
            </h2>
            <p className="text-brand-alabaster-grey-600/80 text-lg">
              Enough context to understand the system quickly, with direct paths
              into the detailed documentation when you need them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
