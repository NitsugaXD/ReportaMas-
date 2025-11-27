import { motion } from "framer-motion";
import type { ComponentPropsWithoutRef } from "react";

export default function AnimatedButton(props: ComponentPropsWithoutRef<typeof motion.button>) {
  return (
    <motion.button
      type={props.type}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.04, boxShadow: "0px 4px 16px rgba(240,176,64,0.12)" }}
      className={
        "px-4 py-2 rounded font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light shadow-md hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-accent-light active:scale-95 " +
        (props.className || "")
      }
      {...props}
    >
      {props.children}
    </motion.button>
  );
}