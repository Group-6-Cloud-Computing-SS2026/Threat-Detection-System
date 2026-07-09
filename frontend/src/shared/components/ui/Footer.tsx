import TeamList from "./TeamList";
import TechList from "./TechList";
import { teamMembers, technologies, links } from "./footerData";

export default function Footer() {
  const githubLink = links.find((link) => link.tag === "GitHub");
  const teacherPageLink = links.find((link) => link.tag === "Teacher Page");

  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-4 justify-between gap-12 py-8 sm:grid-rows-[auto_auto] md:grid-cols-2 md:grid-rows-[auto_auto] md:py-12 lg:grid-cols-[repeat(4,minmax(0,140px))_1fr] lg:grid-rows-1 xl:gap-20">
          <div className="col-span-2 space-y-2">
            <h3 className="text-brand-alabaster-grey-500 text-sm font-medium">
              Team members
            </h3>
            <TeamList members={teamMembers} />
          </div>

          <div className="col-span-2 space-y-2">
            <h3 className="text-brand-alabaster-grey-500 text-sm font-medium">
              Technologies
            </h3>
            <TechList technologies={technologies} />
          </div>

          <div className="inset-x-0 bottom-0 col-span-2 md:col-span-4 lg:col-span-1 lg:text-right">
            <div className="mb-12 flex justify-end">
              <img
                src="/favicon.svg"
                alt="ThreatOff logo"
                width={64}
                height={64}
              />
            </div>
            <div className="text-sm">
              <p className="text-brand-alabaster-grey-500 mb-3">
                © CC Team 6<span> · </span>
                <a
                  className="text-brand-light-green-200/65 hover:text-brand-light-green-500 transition"
                  href={
                    teacherPageLink
                      ? teacherPageLink.url.href
                      : "https://www.christianbaun.de/"
                  }
                  target="_blank"
                  aria-label={teacherPageLink?.tag}
                >
                  CGC26
                </a>
              </p>
              <a
                className="text-brand-alabaster-grey-500 hover:text-brand-alabaster-grey-400 inline-flex transition"
                href={githubLink ? githubLink.url.href : "https://github.com"}
                target="_blank"
                aria-label={githubLink?.tag}
              >
                {/* Github logo */}
                <svg
                  className="h-8 w-8 fill-current"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
