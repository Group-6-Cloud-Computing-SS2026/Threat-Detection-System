import { useEffect } from "react";
import AOS, { type AosOptions } from "aos";

let aosInitialized = false;

export const aosOptions: AosOptions = {
  once: false,
  disable: "phone",
  duration: 600,
  easing: "ease-out-sine",
};

export function useAos(options: AosOptions = aosOptions) {
  useEffect(() => {
    if (!aosInitialized) {
      AOS.init(options);
      aosInitialized = true;
    }

    AOS.refreshHard();
  }, [options]);
}
