import { links } from "../../shared/components/ui/footer/footerData.ts";
import Button from "../../shared/components/ui/Button.tsx";
import GithubIcon from "../../shared/components/ui/icons/GithubIcon.tsx";

export default function HeroHome() {
  const githubLink = links.find((link) => link.tag === "GitHub");

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
              className="font-nacelle m-8 animate-[gradient_6s_linear_infinite_reverse] bg-[linear-gradient(to_right,var(--color-brand-alabaster-grey-100),var(--color-brand-alabaster-grey-50),white,var(--color-brand-alabaster-grey-50),var(--color-brand-alabaster-grey-100))] bg-[length:200%_auto] bg-clip-text pb-5 text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              Detect threats. Recognize risks. In real time.
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
                    href={
                      githubLink ? githubLink.url.href : "https://github.com"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <GithubIcon />
                    Open in GitHub
                  </Button>
                </div>
                <div data-aos="fade-up" data-aos-delay={600}>
                  <Button
                    variant="secondary"
                    href="#workflows"
                    className="w-full sm:w-auto"
                  >
                    See How It Works
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
