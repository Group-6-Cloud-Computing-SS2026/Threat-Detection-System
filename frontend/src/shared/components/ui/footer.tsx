import Logo from "./logo";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        >
        {/*  TODO: ADD LOGO PIC */}

        </div>
        <div className="grid grid-cols-4 justify-between gap-12 py-8 sm:grid-rows-[auto_auto] md:grid-cols-2 md:grid-rows-[auto_auto] md:py-12 lg:grid-cols-[repeat(4,minmax(0,140px))_1fr] lg:grid-rows-1 xl:gap-20">
          {/* Block */}
          <div className="space-y-2 col-span-2">
            <h3 className="text-sm font-medium text-gray-200">Team members</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                  href="#0"
                >
                  Hafiza Fatima Athar
                </a>
              </li>
              <li>
                <a
                  className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                  href="#0"
                >
                  Sadia Saeed
                </a>
              </li>
              <li>
                <a
                  className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                  href="#0"
                >
                  Maham Anis
                </a>
              </li>
              <li>
                <a
                  className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                  href="#0"
                >
                  Mohsin Ayoub
                </a>
              </li>
              <li>
                <a
                  className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                  href="#0"
                >
                  Awais Yaseen
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="#0"
                >
                  Abdul Hanan Javaid
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="#0"
                >
                  Md. Forman Ullah Sajib
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="#0"
                >
                  Javier de Santiago Soto
                </a>
              </li>
            </ul>
          </div>
          {/* Block */}
          <div className="space-y-2 col-span-2">
            <h3 className="text-sm font-medium text-gray-200">Technologies</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="https://react.dev/"
                >
                  React
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="https://www.python.org/"
                >
                  Python
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="https://kubernetes.io/"
                >
                  Kubernetes (k3s)
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="https://www.docker.com/"
                >
                  Docker
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="https://mqtt.org/"
                >
                  MQTT
                </a>
              </li>
              <li>
                <a
                    className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                    href="https://docs.ultralytics.com/models/yolo11#overview"
                >
                  YOLO
                </a>
              </li>
            </ul>
          </div>
          {/* Block */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:text-right inset-x-0 bottom-0">
            <div className="mb-3">
              <Logo />
            </div>
            <div className="text-sm">
              <p className="mb-3 text-brand-light-green-200/65">
                © CC Team 6
                <span className="text-gray-700"> · </span>
                <a
                  className="text-brand-light-green-200/65 transition hover:text-brand-light-green-500"
                  href="https://www.christianbaun.de/CGC26/index.html"
                >
                  CGC26
                </a>
              </p>
              <a
                  className="inline-flex text-brand-light-green-500 transition hover:text-brand-light-green-400"
                  href="https://github.com/orgs/Group-6-Cloud-Computing-SS2026"
                  aria-label="Github"
              >
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
