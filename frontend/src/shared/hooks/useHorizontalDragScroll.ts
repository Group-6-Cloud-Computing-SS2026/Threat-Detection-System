import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export function useHorizontalDragScroll() {
  const draggingRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScrollLeft: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.currentTarget;
    if (target.scrollWidth <= target.clientWidth) return;

    event.preventDefault();

    draggingRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: target.scrollLeft,
    };

    target.setPointerCapture(event.pointerId);
    target.classList.add("select-none");
    target.style.cursor = "grabbing";
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = draggingRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;

    const target = event.currentTarget;
    const deltaX = event.clientX - state.startX;
    target.scrollLeft = state.startScrollLeft - deltaX;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = draggingRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;

    const target = event.currentTarget;
    state.active = false;
    state.pointerId = null;
    target.classList.remove("select-none");
    target.style.cursor = "";

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
