"use client";

import { useEffect, useState, type RefObject } from "react";
import { ArrowUp } from "lucide-react";

type BackToTopButtonProps = {
  scrollRef: RefObject<HTMLElement | null>;
  /** Pixels scrolled before the button appears */
  threshold?: number;
};

export default function BackToTopButton({
  scrollRef,
  threshold = 280,
}: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      setVisible(el.scrollTop > threshold);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, threshold]);

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`absolute bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition-all duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp size={18} strokeWidth={2.25} />
    </button>
  );
}
