import PageIllustration from "./PageIllustration.tsx";
import HeroHome from "./HeroHome.tsx";
import Workflows from "./Workflows.tsx";
import Features from "./Features.tsx";
import Cta from "./Cta.tsx";

export default function LandingPage() {
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

      <section id="landing-page" className="relative">
        <PageIllustration />
        <HeroHome />
        <Workflows />
        <Features />
        <Cta />
      </section>
    </>
  );
}
