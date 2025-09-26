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
      <div className="relative">
        {children}
        <motion.div
          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: -shimmerWidth }}
          animate={{ x: shimmerWidth }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 3,
          }}
          style={{ width: `${shimmerWidth}%` }}
        />
      </div>
    </motion.div>
  );
}