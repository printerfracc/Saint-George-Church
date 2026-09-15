"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function SlideOver({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="إغلاق النموذج"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl max-md:max-w-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slide-over-title"
          >
            <div className="flex items-center justify-between border-b border-gold/40 px-5 py-4">
              <h2 id="slide-over-title" className="text-lg font-bold text-deep-red">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-coptic-gold-dark hover:bg-coptic-gold-main/15"
              >
                إغلاق
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
