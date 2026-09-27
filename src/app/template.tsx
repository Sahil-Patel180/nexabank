"use client";
import { motion } from "framer-motion";
// Route-change transition: every page fades in (opacity only, so fixed/sticky children keep working).
export default function Template({ children }: { children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>;
}
