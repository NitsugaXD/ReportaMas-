import { motion } from "framer-motion";
export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] bg-transparent">
      <motion.div
        className="w-12 h-12 rounded-full border-4 border-accent-light border-t-brand-primary"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
    </div>
  );
}