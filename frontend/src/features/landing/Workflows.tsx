import Spotlight from "./Spotlight.tsx";

const steps = [
  {
    label: "Capture",
    accent: "green",
    description:
      "Raspberry Pi sensor nodes with cameras continuously watch the monitored area and stream frames to the local edge pipeline.",
  },
  {
    label: "Detect",
    accent: "red",
    description:
      "On-device YOLO models identify people in the frame and classify threat events such as theft, fire, and vandalism as they occur.",
  },
  {
    label: "Alert",
    accent: "green",
    description:
      "Confirmed events are published over MQTT and pushed to the live dashboard, so a threat is visible within seconds of detection.",
  },
] as const;

const ACCENT_CLASSES = {
  green: {
    glow: "before:bg-brand-light-green-500/80 after:bg-brand-light-green-500",
    pillText:
      "bg-linear-to-r from-brand-light-green-500 to-brand-light-green-200 bg-clip-text text-transparent",
  },
  red: {
    glow: "before:bg-brand-brick-red-500/80 after:bg-brand-brick-red-500",
    pillText:
      "bg-linear-to-r from-brand-brick-red-500 to-brand-brick-red-200 bg-clip-text text-transparent",
  },
};

export default function Workflows() {
  return (
    <section id="workflows">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <div className="before:to-brand-light-green-200/50 after:to-brand-light-green-200/50 inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent after:h-px after:w-8 after:bg-linear-to-l after:from-transparent">
              <span className="from-brand-light-green-500 to-brand-light-green-200 inline-flex bg-linear-to-r bg-clip-text text-transparent">
                How It Works
              </span>
            </div>
            <h2 className="gradient-text font-nacelle text-brand-alabaster-grey-100 pb-4 text-3xl font-semibold md:text-4xl">
              From camera feed to alert, at the edge
            </h2>
            <p className="text-brand-alabaster-grey-600/80 text-lg">
              Every sensor node runs the full detection pipeline locally, so
              threats are recognized and reported without depending on a
              constant connection to the cloud.
            </p>
          </div>
          {/* Spotlight items */}
          <Spotlight className="group mx-auto grid max-w-sm items-start gap-6 lg:max-w-none lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`
                  group/card bg-brand-carbon-black-800 relative h-full overflow-hidden rounded-2xl p-px
                  before:pointer-events-none before:absolute before:-top-10 before:-left-40 before:z-10 before:h-80 before:w-80
                  before:translate-x-(--mouse-x) before:translate-y-(--mouse-y) before:rounded-full
                  before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 group-hover:before:opacity-100
                  after:pointer-events-none after:absolute after:-top-48 after:-left-48 after:z-30 after:h-64 after:w-64
                  after:translate-x-(--mouse-x) after:translate-y-(--mouse-y) after:rounded-full
                  after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20
                  ${ACCENT_CLASSES[step.accent].glow}
                `}
              >
                <div className="bg-brand-pitch-black-500 after:from-brand-carbon-black-900/50 after:via-brand-carbon-black-800/25 after:to-brand-carbon-black-900/50 relative z-20 h-full overflow-hidden rounded-[inherit] after:absolute after:inset-0 after:bg-linear-to-br">
                  {/* Step number */}
                  <div
                    className="border-brand-carbon-black-700/50 bg-brand-carbon-black-800/65 text-brand-alabaster-grey-200 absolute
                    top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium
                    invisible opacity-0 transition-opacity duration-300 group-hover/card:visible group-hover/card:opacity-100"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </div>
                  {/* Content */}
                  <div className="p-6 text-center">
                    <div className="mb-3 flex justify-start">
                      <span
                        className={`
                          btn-sm bg-brand-carbon-black-800/40 relative rounded-full px-2.5 py-0.5 text-xs font-normal
                          before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent
                          before:[background:linear-gradient(to_bottom,--theme(--color-brand-carbon-black-700/.15),--theme(--color-brand-carbon-black-700/.5))_border-box]
                          before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,linear-gradient(white_0_0)]
                          hover:bg-brand-carbon-black-800/60
                        `}
                      >
                        <span className={ACCENT_CLASSES[step.accent].pillText}>
                          {step.label}
                        </span>
                      </span>
                    </div>
                    <p className="mx-auto mt-6 max-w-sm text-brand-alabaster-grey-600/80">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Spotlight>
        </div>
      </div>
    </section>
  );
}
