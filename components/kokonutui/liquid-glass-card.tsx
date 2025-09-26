"use client";

import { motion } from "framer-motion";

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  glow?: boolean;
}

export default function LiquidGlassCard({
  children,
  className = "",
  blur = "md",
  glow = true,
}: LiquidGlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
      
      {/* Glass effect */}
      <div 
        className={`
          relative rounded-xl border border-white/20 
          ${blurClasses[blur]} 
          ${glow ? "shadow-2xl shadow-purple-500/10" : ""}
        `}
      >
        {/* Inner glow */}
        {glow && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        )}
        
        {/* Content */}
        <div className="relative p-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
}