import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import type { Transition } from "framer-motion";
import { useEffect, useState } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 32 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -32 },
};

const pageTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.8,
};

function getBgColor() {
  if (typeof window !== "undefined") {
    if (document.documentElement.classList.contains("dark")) {
      return "#05060A";
    } else {
      return "#F7F7FA";
    }
  }
  return "#F7F7FA";
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [bg, setBg] = useState(getBgColor());

  useEffect(() => {
    const observer = new MutationObserver(() => setBg(getBgColor()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen w-full transition-colors"
        style={{ background: bg }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}