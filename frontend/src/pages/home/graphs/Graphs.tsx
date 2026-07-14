import { useState } from "react";
import { homeInnerFrameClass } from "../homeSurface.ts";
import { FrameLoader } from "../PageLoaders.tsx";

export default function Graphs() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <div className="mb-4" data-aos="fade-up">
        <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
          Amdahl&rsquo;s &amp; Gustafson&rsquo;s law results
        </h2>
        <p className="text-brand-alabaster-grey-600 text-sm">
          Scaling law benchmark charts served from
          /amdahl-gustafson-graphs.html.
        </p>
      </div>
      <div
        className={`${homeInnerFrameClass} relative min-h-[32rem] flex-1 overflow-hidden rounded-xl`}
        data-aos="zoom-in"
        data-aos-delay={120}
      >
        {!isLoaded ? (
          <div className="absolute inset-0 z-10 bg-brand-pitch-black-500/95">
            <FrameLoader label="Loading scaling charts">
              Rendering the benchmark report.
            </FrameLoader>
          </div>
        ) : null}
        <iframe
          src="amdahl-gustafson-graphs.html"
          title="Scaling law results"
          className="h-full w-full"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </>
  );
}
