import Button from "../../shared/components/ui/Button.tsx";

export default function HeroHome() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <div className="mb-16 flex justify-center">
              <img
                src="/images/wordmark-dark.svg"
                alt="ThreatOff"
                className="h-44 w-auto"
              />
            </div>

            <h1
              className="gradient-text font-nacelle m-8 pb-5 text-4xl leading-20 font-semibold md:text-5xl"
              data-aos="fade-up"
            >
              Smarter monitoring. Faster detection. Instant alerts at the edge.
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="text-brand-alabaster-grey-600/80 mb-8 text-xl"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                ThreatOff turns single-board sensor nodes into an intelligent
                monitoring network. It identifies people and flags threat events
                — theft, fire, vandalism — the moment they happen, without
                waiting on a round trip to the cloud.
              </p>
              <div className="mx-auto flex max-w-xs flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
                <div data-aos="fade-up" data-aos-delay={400}>
                  <Button
                    variant="github"
                    href="/auth"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    Open Dashboard
                  </Button>
                </div>
                <div data-aos="fade-up" data-aos-delay={600}>
                  <Button
                    variant="secondary"
                    href="/docs"
                    className="w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12"
            data-aos="fade-up"
            data-aos-delay={200}
          >
            <div className="text-center">
              <div className="font-nacelle text-brand-alabaster-grey-100 text-2xl font-semibold">
                Raspberry Pi
              </div>
              <div className="text-brand-alabaster-grey-600/70 text-sm">
                Sensor nodes
              </div>
            </div>
            <div className="text-center">
              <div className="font-nacelle text-brand-alabaster-grey-100 text-2xl font-semibold">
                YOLO
              </div>
              <div className="text-brand-alabaster-grey-600/70 text-sm">
                On-device detection
              </div>
            </div>
            <div className="text-center">
              <div className="font-nacelle text-brand-alabaster-grey-100 text-2xl font-semibold">
                MQTT + k3s
              </div>
              <div className="text-brand-alabaster-grey-600/70 text-sm">
                Real-time alerting
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
