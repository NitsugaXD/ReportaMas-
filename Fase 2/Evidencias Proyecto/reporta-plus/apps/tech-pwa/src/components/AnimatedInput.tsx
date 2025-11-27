import { motion } from "framer-motion";
import type { ComponentPropsWithoutRef, ForwardedRef } from "react";
import React from "react";

const inputMotion = {
  focus: { boxShadow: "0 0 0 2px #F3C04966" },
  rest:  { boxShadow: "0 0 0 0px #0000"   }
};

export const AnimatedInput = React.forwardRef(function AnimatedInput(
  props: ComponentPropsWithoutRef<typeof motion.input>,
  ref: ForwardedRef<HTMLInputElement>
) {
  return (
    <motion.input
      ref={ref}
      initial="rest"
      whileFocus="focus"
      whileHover="focus"
      animate="rest"
      variants={inputMotion}
      transition={{ type: "tween", duration: 0.18 }}
      className={
        "w-full border rounded-lg px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-accent-light transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark " +
        (props.className || "")
      }
      {...props}
    />
  );
});
export const AnimatedTextarea = React.forwardRef(function AnimatedTextarea(
  props: ComponentPropsWithoutRef<typeof motion.textarea>,
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  return (
    <motion.textarea
      ref={ref}
      initial="rest"
      whileFocus="focus"
      whileHover="focus"
      animate="rest"
      variants={inputMotion}
      transition={{ type: "tween", duration: 0.18 }}
      className={
        "w-full border rounded-lg px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-accent-light transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark " +
        (props.className || "")
      }
      {...props}
    />
  );
});
export const AnimatedSelect = React.forwardRef(function AnimatedSelect(
  props: ComponentPropsWithoutRef<typeof motion.select>,
  ref: ForwardedRef<HTMLSelectElement>
) {
  return (
    <motion.select
      ref={ref}
      initial="rest"
      whileFocus="focus"
      whileHover="focus"
      animate="rest"
      variants={inputMotion}
      transition={{ type: "tween", duration: 0.18 }}
      className={
        "w-full border rounded-lg px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-accent-light transition bg-no-repeat dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark " +
        (props.className || "")
      }
      {...props}
    />
  );
});