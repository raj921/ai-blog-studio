"use client";

import { motion } from "framer-motion";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export default function ShimmerText({ 
  children, 
  className = "",
  shimmerWidth = 100
}: ShimmerTextProps) {
  return (
    <motion.div
      className={`relative inline-block overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10">
        {children}
        <motion.div
          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          initial={{ x: -shimmerWidth }}
          animate={{ x: shimmerWidth }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 4,
          }}
          style={{ width: `${shimmerWidth}%` }}
        />
      </div>
    </motion.div>
  );
}