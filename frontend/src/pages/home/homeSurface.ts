export const homeSurfaceClass =
  "border border-brand-carbon-black-700/70 bg-[linear-gradient(180deg,rgba(22,22,22,0.94),rgba(10,10,10,0.90))] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl";

export const homePanelClass = `${homeSurfaceClass} relative overflow-hidden rounded-2xl`;

export const homePanelHoverClass = `${homePanelClass} transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-carbon-black-600 hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`;

export const homeInnerFrameClass =
  "border border-brand-carbon-black-700/70 bg-brand-pitch-black-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
