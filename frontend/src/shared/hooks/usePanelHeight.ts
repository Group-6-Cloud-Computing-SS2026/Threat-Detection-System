import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function usePanelHeight(dependency?: unknown) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = panelRef.current;
    if (!element) return;
    setPanelHeight(element.scrollHeight);
  }, [dependency]);

  useEffect(() => {
    const element = panelRef.current;
    if (!element) return;

    const updateHeight = () => {
      setPanelHeight(element.scrollHeight);
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight);
    });
    observer.observe(element);

    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return { panelRef, panelHeight };
}
