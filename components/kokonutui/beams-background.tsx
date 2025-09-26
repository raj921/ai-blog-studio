"use client";

import { motion } from "framer-motion";

interface BeamsBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export default function BeamsBackground({ 
  className = "",
  children 
}: BeamsBackgroundProps) {
  const beams = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.2,
    duration: 3 + Math.random() * 2,
    rotate: Math.random() * 360,
  }));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated beams */}
      <div className="absolute inset-0">
        {beams.map((beam) => (
          <motion.div
            key={beam.id}
            className="absolute inset-0 opacity-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{
              duration: beam.duration,
              delay: beam.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div
              className="w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent transform-gpu"
              style={{
                transform: `rotate(${beam.rotate}deg) translateX(${
                  50 + Math.sin(beam.id) * 200
                }px)`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-purple-900/5 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}