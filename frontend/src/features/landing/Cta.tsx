import { links } from "../../shared/components/ui/footer/footerData.ts";
import Button from "../../shared/components/ui/Button.tsx";
import GithubIcon from "../../shared/components/ui/icons/GithubIcon.tsx";

export default function Cta() {
  const githubLink = links.find((link) => link.tag === "GitHub");
  const teacherPageLink = links.find((link) => link.tag === "Teacher Page");

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -mb-24 ml-20 -translate-x-1/2"
        aria-hidden="true"
      >
        <img
          className="max-w-none"
          src="/images/blurred-shape.svg"
          width={760}
          height={668}
          alt="Blurred shape"
        />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="via-brand-pitch-black-950 bg-linear-to-r from-transparent py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="font-nacelle text-brand-alabaster-grey-100 pb-4 text-3xl font-semibold md:text-4xl"
              data-aos="fade-up"
            >
              See ThreatOff in action
            </h2>
            <p
              className="text-brand-alabaster-grey-600/80 mx-auto mb-8 max-w-2xl text-lg"
              data-aos="fade-up"
              data-aos-delay={200}
            >
              Explore the source code, the reproducible edge-computing setup,
              and the course this project was built for.
            </p>
            <div className="mx-auto flex max-w-xs flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
              <div data-aos="fade-up" data-aos-delay={400}>
                <Button
                  variant="github"
                  className="w-full sm:w-auto"
                  href={githubLink ? githubLink.url.href : "https://github.com"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GithubIcon />
                  View on GitHub
                </Button>
              </div>
              <div data-aos="fade-up" data-aos-delay={600}>
                <Button
                  variant="secondary"
                  className="w-full border-transparent bg-transparent sm:w-auto"
                  href={
                    teacherPageLink
                      ? teacherPageLink.url.href
                      : "https://www.christianbaun.de/"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Course Page →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
