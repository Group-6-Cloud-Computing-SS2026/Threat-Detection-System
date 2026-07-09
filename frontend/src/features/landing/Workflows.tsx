import Spotlight from "./Spotlight.tsx";

const steps = [
  {
    image: "/images/workflow-01.png",
    label: "Capture",
    accent: "green",
    description:
      "Raspberry Pi sensor nodes with cameras continuously watch the monitored area and stream frames to the local edge pipeline.",
  },
  {
    image: "/images/workflow-02.png",
    label: "Detect",
    accent: "red",
    description:
      "On-device YOLO models identify people in the frame and classify threat events such as theft, fire, and vandalism as they occur.",
  },
  {
    image: "/images/workflow-03.png",
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
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-brand-light-green-200/50 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-brand-light-green-200/50">
              <span className="inline-flex bg-linear-to-r from-brand-light-green-500 to-brand-light-green-200 bg-clip-text text-transparent">
                How It Works
              </span>
            </div>
            <h2 className="pb-4 font-nacelle text-3xl font-semibold text-brand-alabaster-grey-100 md:text-4xl">
              From camera feed to alert, at the edge
            </h2>
            <p className="text-lg text-brand-alabaster-grey-600/80">
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
                className={`group/card relative h-full overflow-hidden rounded-2xl bg-brand-carbon-black-800 p-px before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100 ${ACCENT_CLASSES[step.accent].glow}`}
              >
                <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-brand-pitch-black-500 after:absolute after:inset-0 after:bg-linear-to-br after:from-brand-carbon-black-900/50 after:via-brand-carbon-black-800/25 after:to-brand-carbon-black-900/50">
                  {/* Step number */}
                  <div
                    className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-brand-carbon-black-700/50 bg-brand-carbon-black-800/65 text-sm font-medium text-brand-alabaster-grey-200"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </div>
                  {/* Image */}
                  <img
                    className="inline-flex"
                    src={step.image}
                    width={350}
                    height={288}
                    alt={step.label}
                  />
                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="btn-sm relative rounded-full bg-brand-carbon-black-800/40 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-brand-carbon-black-700/.15),--theme(--color-brand-carbon-black-700/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-brand-carbon-black-800/60">
                        <span className={ACCENT_CLASSES[step.accent].pillText}>
                          {step.label}
                        </span>
                      </span>
                    </div>
                    <p className="text-brand-alabaster-grey-600/80">
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
