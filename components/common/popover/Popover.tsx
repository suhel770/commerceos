"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  width?: number;
}

export default function Popover({
  trigger,
  children,
  width = 380,
}: PopoverProps) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          e.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    window.addEventListener(
      "mousedown",
      handleClick
    );

    return () =>
      window.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <div
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </div>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{
            width,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}