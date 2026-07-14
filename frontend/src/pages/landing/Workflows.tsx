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
    pillText: "text-brand-light-green-200",
    pillBg: "bg-brand-light-green-500/16 border-brand-light-green-500/35",
    numberBg: "bg-brand-light-green-500/15 border-brand-light-green-500/35",
  },
  red: {
    glow: "before:bg-brand-brick-red-500/80 after:bg-brand-brick-red-500",
    pillText: "text-brand-brick-red-200",
    pillBg: "bg-brand-brick-red-500/16 border-brand-brick-red-500/35",
    numberBg: "bg-brand-brick-red-500/15 border-brand-brick-red-500/35",
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
              <span className="text-brand-light-green-300 inline-flex font-medium tracking-wide">
                How It Works
              </span>
            </div>
            <h2 className="gradient-text font-nacelle text-brand-alabaster-grey-100 pb-4 text-3xl font-semibold md:text-4xl">
              From camera feed to alert, at the edge
            </h2>
            <p className="text-brand-alabaster-grey-500 text-lg">
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
                className={`group/card bg-brand-carbon-black-800/95 border-brand-carbon-black-700/70 relative h-full overflow-hidden rounded-2xl border p-px shadow-lg before:pointer-events-none before:absolute before:-top-10 before:-left-40 before:z-10 before:h-80 before:w-80 before:translate-x-(--mouse-x) before:translate-y-(--mouse-y) before:rounded-full before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 group-hover:before:opacity-100 after:pointer-events-none after:absolute after:-top-48 after:-left-48 after:z-30 after:h-64 after:w-64 after:translate-x-(--mouse-x) after:translate-y-(--mouse-y) after:rounded-full after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 ${ACCENT_CLASSES[step.accent].glow} `}
              >
                <div className="bg-brand-pitch-black-500/95 after:from-brand-carbon-black-900/55 after:via-brand-carbon-black-800/30 after:to-brand-carbon-black-900/55 relative z-20 h-full overflow-hidden rounded-[inherit] after:absolute after:inset-0 after:bg-linear-to-br">
                  {/* Step number */}
                  <div
                    className={`text-brand-alabaster-grey-100 absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold shadow-sm ${ACCENT_CLASSES[step.accent].numberBg}`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </div>
                  {/* Content */}
                  <div className="p-6 text-center">
                    <div className="mb-3 flex justify-start">
                      <span
                        className={`btn-sm relative rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${ACCENT_CLASSES[step.accent].pillBg} bg-brand-carbon-black-900/80 text-brand-alabaster-grey-100 hover:bg-brand-carbon-black-800/85 shadow-sm transition-colors`}
                      >
                        <span className={ACCENT_CLASSES[step.accent].pillText}>
                          {step.label}
                        </span>
                      </span>
                    </div>
                    <p className="text-brand-alabaster-grey-500 mx-auto mt-6 max-w-sm">
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
