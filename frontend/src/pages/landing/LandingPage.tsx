import { useEffect } from "react";
import AOS from "aos";
import PageIllustration from "./PageIllustration.tsx";
import HeroHome from "./HeroHome.tsx";
import Workflows from "./Workflows.tsx";
import Features from "./Features.tsx";
import Cta from "./Cta.tsx";

export default function LandingPage() {
  useEffect(() => {
    const refreshAos = () => {
      AOS.refreshHard();
    };

    const frameId = window.requestAnimationFrame(refreshAos);
    window.addEventListener("load", refreshAos, { once: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("load", refreshAos);
    };
  }, []);

  return (
    <>
      <title>ThreatOff — Edge Computing Threat Detection</title>
      <meta
        property="og:title"
        content="ThreatOff — Edge Computing Threat Detection"
      />
      <meta
        name="description"
        content="An edge-computing platform that detects people and identifies threats — theft, fire, vandalism — in real time from Raspberry Pi sensor nodes."
      />

      <section
        id="landing-page"
        className="bg-brand-pitch-black-500 relative isolate min-h-screen overflow-hidden"
      >
        <div className="relative z-10">
          <PageIllustration />
          <HeroHome />
          <Workflows />
          <Features />
          <Cta />
        </div>
      </section>
    </>
  );
}
