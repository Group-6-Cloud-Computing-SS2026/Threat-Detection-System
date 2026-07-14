import { teamMembers, technologies, links } from "./footerData.ts";
import FooterList from "./FooterList.tsx";
import GithubIcon from "../icons/GithubIcon.tsx";

export default function Footer() {
  const githubLink = links.find((link) => link.tag === "GitHub");
  const teacherPageLink = links.find((link) => link.tag === "Teacher Page");

  return (
    <footer className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute right-0 bottom-0 z-0 translate-x-1/4"
        aria-hidden="true"
      >
        <img
          className="max-w-none opacity-95 contrast-125 grayscale"
          src="/images/footer-illustration.svg"
          width={1076}
          height={378}
          alt=""
        />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-4 justify-between gap-12 py-8 sm:grid-rows-[auto_auto] md:grid-cols-2 md:grid-rows-[auto_auto] md:py-12 lg:grid-cols-[repeat(4,minmax(0,140px))_1fr] lg:grid-rows-1 xl:gap-20">
          <div className="col-span-2 space-y-2">
            <h3 className="text-brand-alabaster-grey-500 text-sm font-medium">
              Team members
            </h3>
            <FooterList urls={teamMembers} />
          </div>

          <div className="col-span-2 space-y-2">
            <h3 className="text-brand-alabaster-grey-500 text-sm font-medium">
              Technologies
            </h3>
            <FooterList urls={technologies} />
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
                <GithubIcon className="mt-1 h-6 w-auto fill-current" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
