"use client";

import { useEffect, useRef } from "react";

/**
 * Native <details> dropdowns don't close when you click elsewhere or press
 * Escape. Attach the returned ref to a <details> element to get that behaviour.
 *
 *   const ref = useDetailsAutoClose();
 *   <details ref={ref}>…</details>
 */
export function useDetailsAutoClose() {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = ref.current;
      // Only act when open, and only when the click landed outside the dropdown.
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && ref.current?.open) ref.current.open = false;
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return ref;
}
