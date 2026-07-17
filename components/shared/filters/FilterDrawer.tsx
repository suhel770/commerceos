"use client";

import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface FilterDrawerProps {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export default function FilterDrawer({
  open,
  title,
  children,
  footer,
  onClose,
}: FilterDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Drawer */}

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 30,
            }}
            className="
              fixed
              right-0
              top-0
              z-[100]
              flex
              h-screen
              w-full
              flex-col
              bg-white
              shadow-2xl
              sm:w-[460px]
            "
          >
            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-900">
                {title}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-lg
                  p-2
                  transition
                  hover:bg-slate-100
                "
              >
                <X size={20} />
              </button>

            </div>

            {/* Content */}

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>

            {/* Footer */}

            {footer && (
              <div className="border-t border-slate-200 bg-white px-6 py-5">
                {footer}
              </div>
            )}

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}